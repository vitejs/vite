import os from 'os'
import fs from 'fs'
import path from 'path'
import _debug from 'debug'
import * as http from 'http'
import * as https from 'https'
import connect from 'connect'
import corsMiddleware from 'cors'
import chalk from 'chalk'
import { AddressInfo } from 'net'
import sirv, { Options as SirvOptions } from 'sirv'
import chokidar from 'chokidar'
import { resolveConfig, UserConfig, ResolvedConfig } from '../config'
import {
  createPluginContainer,
  RollupPluginContainer
} from '../server/pluginContainer'
import { loadFsEvents } from './fsEventsImporter'
import { FSWatcher, WatchOptions } from '../types/chokidar'
import { resolveHttpsConfig } from '../server/https'
import { setupWebSocketServer, WebSocketServer } from '../server/ws'
import { setupProxy, ProxyOptions } from './proxy'
import { createTransformMiddleware } from './transform'
import history from 'connect-history-api-fallback'

// shim connect app.sue for inference
// https://github.com/DefinitelyTyped/DefinitelyTyped/pull/49994
declare module 'connect' {
  interface Server {
    use(fn: connect.NextHandleFunction): connect.Server
  }
}

export interface ServerOptions {
  host?: string
  port?: number
  /**
   * Enable TLS + HTTP/2.
   * Note: this downgrades to TLS only when the proxy option is also used.
   */
  https?: boolean | https.ServerOptions
  /**
   * Force dep pre-optimization regardless of whether deps have changed.
   */
  force?: boolean
  /**
   * Configure HMR-specific options (port, host, path & protocol)
   */
  hmr?: HmrOptions | boolean
  /**
   * chokidar watch options
   * https://github.com/paulmillr/chokidar#api
   */
  watch?: WatchOptions
  /**
   * Configure custom proxy rules for the dev server. Expects an object
   * of `{ key: options }` pairs.
   * Uses [`http-proxy`](https://github.com/http-party/node-http-proxy).
   * Full options [here](https://github.com/http-party/node-http-proxy#options).
   *
   * Example `vite.config.js`:
   * ``` js
   * module.exports = {
   *   proxy: {
   *     // string shorthand
   *     '/foo': 'http://localhost:4567/foo',
   *     // with options
   *     '/api': {
   *       target: 'http://jsonplaceholder.typicode.com',
   *       changeOrigin: true,
   *       rewrite: path => path.replace(/^\/api/, '')
   *     }
   *   }
   * }
   * ```
   */
  proxy?: Record<string, string | ProxyOptions>
  /**
   * Configure CORS for the dev server.
   * Uses https://github.com/expressjs/cors.
   * Set to `true` to allow all methods from any origin, or configure separately
   * using an object.
   */
  cors?: CorsOptions | boolean
}

export interface HmrOptions {
  protocol?: string
  host?: string
  port?: number
  path?: string
}

/**
 * https://github.com/expressjs/cors#configuration-options
 */
export interface CorsOptions {
  origin?:
    | CorsOrigin
    | ((origin: string, cb: (err: Error, origins: CorsOrigin) => void) => void)
  methods?: string | string[]
  allowedHeaders?: string | string[]
  exposedHeaders?: string | string[]
  credentials?: boolean
  maxAge?: number
  preflightContinue?: boolean
  optionsSuccessStatus?: number
}

export type CorsOrigin = boolean | string | RegExp | (string | RegExp)[]

export type ServerHook = (ctx: ServerContext) => (() => void) | void

export interface ServerContext {
  /**
   * Project root (where index.html is located)
   */
  root: string
  /**
   * connect app instance
   * https://github.com/senchalabs/connect#use-middleware
   */
  app: connect.Server
  /**
   * native Node http server instance
   */
  server: http.Server
  /**
   * chokidar watcher instance
   * https://github.com/paulmillr/chokidar#api
   */
  watcher: FSWatcher
  /**
   * web socket server with `send(payload)` method
   */
  ws: WebSocketServer
  /**
   * Rollup plugin container that can run plugin hooks on a given file
   */
  container: RollupPluginContainer
  /**
   * The resolved vite config object
   */
  config: ResolvedConfig
}

export interface ViteDevServer extends http.Server {
  context: ServerContext
}

export async function createServer(
  inlineConfig: UserConfig = {},
  mode = 'development',
  configPath?: string
): Promise<ViteDevServer> {
  const resolvedConfig = await resolveConfig(
    inlineConfig,
    'serve',
    mode,
    configPath
  )

  const serverConfig = resolvedConfig.server || {}

  const app = connect() as connect.Server
  const server = (await resolveServer(serverConfig, app)) as ViteDevServer

  const root = resolvedConfig.root
  const { watch = {}, cors, proxy } = serverConfig

  // try to load fsevents before starting chokidar
  await loadFsEvents()
  const watcher = chokidar.watch(root, {
    ignored: ['**/node_modules/**', '**/.git/**', ...(watch.ignored || [])],
    ignoreInitial: true,
    ignorePermissionErrors: true,
    ...watch
  }) as FSWatcher

  const container = await createPluginContainer(resolvedConfig.plugins)
  const ws = setupWebSocketServer(server)

  const context: ServerContext = (server.context = {
    root,
    app,
    server,
    watcher,
    container,
    ws,
    config: resolvedConfig
  })

  // apply server configuration hooks from plugins
  const postHooks: ((() => void) | void)[] = []
  for (const plugin of resolvedConfig.plugins) {
    const hook = plugin.configureServer
    if (Array.isArray(hook)) {
      hook.forEach((fn) => postHooks.push(fn(context)))
    } else if (hook) {
      postHooks.push(hook(context))
    }
  }

  // cors
  if (cors) {
    app.use(corsMiddleware(typeof cors === 'boolean' ? {} : cors))
  }

  // proxy
  if (proxy) {
    setupProxy(context)
  }

  // main transform middleware
  app.use(createTransformMiddleware(context))

  // serve static files
  const sirvOptions: SirvOptions = { dev: true, etag: true }
  app.use(sirv(root, sirvOptions))
  app.use(sirv(path.join(root, 'public'), sirvOptions))

  // spa fallback
  app.use(history({ logger: _debug('vite:spa-fallback') }))

  // run post config hooks
  postHooks.forEach((fn) => fn && fn())

  // final catch all
  app.use((req, res) => {
    if (req.url === '/index.html') {
      let index
      try {
        index = fs.readFileSync(path.join(root, 'index.html'), 'utf-8')
      } catch (e) {}
      if (index) {
        // TODO parse/rewrite index
        res.statusCode = 200
        return res.end(index.replace('hello', 'world'))
      }
    }
    res.statusCode = 404
    res.end()
  })

  // overwrite listen to run optimizer before server start
  const listen = server.listen.bind(server)
  server.listen = (async (port: number, ...args: any[]) => {
    // TODO run optimizer
    return listen(port, ...args)
  }) as any

  server.once('listening', () => {
    // update actual port since this may be different from initial value
    serverConfig.port = (server.address() as AddressInfo).port
  })

  return server
}

async function resolveServer(
  { https = false, proxy }: ServerOptions,
  app: connect.Server
): Promise<http.Server> {
  if (!https) {
    return require('http').createServer(app)
  }

  const httpsOptions = await resolveHttpsConfig(
    typeof https === 'boolean' ? {} : https
  )
  if (proxy) {
    // #484 fallback to http1 when proxy is needed.
    return require('https').createServer(httpsOptions, app)
  } else {
    return require('http2').createSecureServer(
      {
        ...httpsOptions,
        allowHTTP1: true
      },
      app
    )
  }
}

export async function startServer(
  inlineConfig: UserConfig = {},
  mode = 'development',
  configPath?: string
): Promise<ViteDevServer> {
  const server = await createServer(inlineConfig, mode, configPath)

  const resolvedOptions = server.context.config.server || {}
  let port = resolvedOptions.port || 3000
  let hostname = resolvedOptions.host || 'localhost'
  const protocol = resolvedOptions.https ? 'https' : 'http'

  server.on('error', (e: Error & { code?: string }) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying another one...`)
      setTimeout(() => {
        server.close()
        server.listen(++port)
      }, 100)
    } else {
      console.error(chalk.red(`[vite] server error:`))
      console.error(e)
    }
  })

  server.listen(port, () => {
    console.log()
    console.log(`  Dev server running at:`)
    console.log()
    const interfaces = os.networkInterfaces()
    Object.keys(interfaces).forEach((key) =>
      (interfaces[key] || [])
        .filter((details) => details.family === 'IPv4')
        .map((detail) => {
          return {
            type: detail.address.includes('127.0.0.1')
              ? 'Local:   '
              : 'Network: ',
            host: detail.address.replace('127.0.0.1', hostname)
          }
        })
        .forEach(({ type, host }) => {
          const url = `${protocol}://${host}:${chalk.bold(port)}/`
          console.log(`  > ${type} ${chalk.cyan(url)}`)
        })
    )
    console.log()
    console.log(
      // @ts-ignore
      chalk.cyan(`  ready in ${Date.now() - global.__vite_start_time}ms.`)
    )
    console.log()
  })

  return server
}
