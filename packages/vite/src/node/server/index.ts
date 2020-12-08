import os from 'os'
import path from 'path'
import * as http from 'http'
import * as https from 'https'
import connect from 'connect'
import chalk from 'chalk'
import { AddressInfo } from 'net'
import sirv, { Options as SirvOptions } from 'sirv'
import chokidar, { FSWatcher, WatchOptions } from 'chokidar'
import { resolveConfig, UserConfig, ResolvedConfig } from '../config'
import {
  createPluginContainer,
  RollupPluginContainer
} from '../server/pluginContainer'
import { resolveHttpsConfig } from '../server/https'
import { setupWebSocketServer, WebSocketConnection } from '../server/ws'
import { setupProxy, ProxyOptions } from './proxy'
import { createTransformMiddleware } from './transform'

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
  force?: boolean
  hmr?: HmrOptions | boolean
  watch?: WatchOptions
  proxy?: Record<string, string | ProxyOptions>
  cors?: CorsOptions | boolean
}

export interface HmrOptions {
  protocol?: string
  hostname?: string
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
  root: string
  app: connect.Server
  server: http.Server
  watcher: FSWatcher
  ws: WebSocketConnection
  container: RollupPluginContainer
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
  const server = resolveServer(serverConfig, app) as ViteDevServer

  const root = resolvedConfig.root
  const { watch = {}, cors, proxy } = serverConfig

  const watcher = chokidar.watch(root, {
    ignored: ['**/node_modules/**', '**/.git/**', ...(watch.ignored || [])],
    ignoreInitial: true,
    ignorePermissionErrors: true,
    ...watch
  })

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
    app.use(require('cors')(typeof cors === 'boolean' ? {} : cors))
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

  // run post config hooks
  postHooks.forEach((fn) => fn && fn())

  app.use((req, res) => {
    console.log(req.url)
    // @TODO index.html fallback + code injection
    res.end('catch all')
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

function resolveServer(
  { https = false, proxy }: ServerOptions,
  app: connect.Server
): http.Server {
  if (!https) {
    return require('http').createServer(app)
  }

  const httpsOptions = typeof https === 'boolean' ? {} : https
  if (proxy) {
    // #484 fallback to http1 when proxy is needed.
    return require('https').createServer(resolveHttpsConfig(httpsOptions), app)
  } else {
    return require('http2').createSecureServer(
      {
        ...resolveHttpsConfig(httpsOptions),
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
