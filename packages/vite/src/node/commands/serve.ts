import os from 'os'
import connect from 'connect'
import chalk from 'chalk'
import { AddressInfo } from 'net'
import chokidar, { FSWatcher, WatchOptions } from 'chokidar'
import { RequestListener, Server } from 'http'
import { ServerOptions as HttpsServerOptions } from 'https'
import { resolveConfig, Config, ResolvedConfig } from '../config'
import {
  createPluginContainer,
  RollupPluginContainer
} from '../lib/pluginContainer'
import { resolveHttpsConfig } from '../lib/https'
import { setupServer } from '../lib/setupServer'
import { ServerOptions as ProxyOptions } from 'http-proxy'

export interface ServerOptions {
  host?: string
  port?: number
  /**
   * Enable TLS + HTTP/2.
   * Note: this downgrades to TLS only when the proxy option is also used.
   */
  https?: boolean | HttpsServerOptions
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

export type ServerHook = (ctx: ServerPluginContext) => void

export interface ServerPluginContext {
  root: string
  app: connect.Server
  server: Server
  watcher: FSWatcher
  container: RollupPluginContainer
  config: ResolvedConfig
}

export interface ViteDevServer extends Server {
  context: ServerPluginContext
}

export async function createServer(
  inlineConfig: Config = {},
  configPath?: string
): Promise<ViteDevServer> {
  const resolvedConfig = await resolveConfig(
    inlineConfig,
    'development',
    configPath
  )

  const serverConfig = resolvedConfig.server || {}
  const root = resolvedConfig.root
  const app = connect()
  const server = resolveServer(serverConfig, app) as ViteDevServer

  const userWatchOptions = serverConfig.watch || {}
  const watcher = chokidar.watch(root, {
    ignored: [
      '**/node_modules/**',
      '**/.git/**',
      ...(userWatchOptions.ignored || [])
    ],
    ignoreInitial: true,
    ignorePermissionErrors: true,
    ...userWatchOptions
  })

  const container = await createPluginContainer(resolvedConfig.plugins)

  const context: ServerPluginContext = (server.context = {
    root,
    app,
    server,
    watcher,
    container,
    config: resolvedConfig
  })

  setupServer(context)

  // apply server configuration hooks from plugins
  for (const plugin of resolvedConfig.plugins) {
    const hook = plugin.configureServer
    if (Array.isArray(hook)) {
      hook.forEach((fn) => fn(context))
    } else if (hook) {
      hook(context)
    }
  }

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
  requestListener: RequestListener
): Server {
  if (!https) {
    return require('http').createServer(requestListener)
  }

  const httpsOptions = typeof https === 'boolean' ? {} : https
  if (proxy) {
    // #484 fallback to http1 when proxy is needed.
    return require('https').createServer(
      resolveHttpsConfig(httpsOptions),
      requestListener
    )
  } else {
    return require('http2').createSecureServer(
      {
        ...resolveHttpsConfig(httpsOptions),
        allowHTTP1: true
      },
      requestListener
    )
  }
}

export async function startServer(
  inlineConfig: Config = {},
  configPath?: string
): Promise<ViteDevServer> {
  const start = Date.now()
  const server = await createServer(inlineConfig, configPath)

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
    console.log(chalk.cyan(`[vite] server ready in ${Date.now() - start}ms.`))
  })

  return server
}
