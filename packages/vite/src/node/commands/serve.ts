import os from 'os'
import chalk from 'chalk'
import Koa from 'koa'
import chokidar, { FSWatcher, WatchOptions } from 'chokidar'
import { RequestListener, Server } from 'http'
import { ServerOptions as HttpsServerOptions } from 'https'
import { resolveConfig, Config, ResolvedConfig } from '../config'
import { resolveHttpsConfig } from '../lib/https'
import { AddressInfo } from 'net'

export interface ServerOptions {
  host?: string
  port?: number
  /**
   * Enable TLS + HTTP/2.
   * Note: this downgrades to TLS only when the proxy option is also used.
   */
  https?: boolean | HttpsServerOptions
  force?: boolean
  hmr?: HmrConfig | boolean
  watch?: WatchOptions
  // TODO
  cors?: {} | boolean
  // TODO
  proxy?: Record<string, string | {}>
}

export interface HmrConfig {
  protocol?: string
  hostname?: string
  port?: number
  path?: string
}

export type ServerPlugin = (ctx: ServerPluginContext) => void

export interface ServerPluginContext {
  root: string
  app: Koa
  server: Server
  watcher: FSWatcher
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
  const app = new Koa()
  const server = resolveServer(serverConfig, app.callback()) as ViteDevServer

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

  const context: ServerPluginContext = (server.context = {
    root,
    app,
    server,
    watcher,
    config: resolvedConfig
  })

  // apply server configuration from plugins
  for (const plugin of resolvedConfig.plugins) {
    const fn = plugin.configureServer
    if (Array.isArray(fn)) {
      fn.forEach((fn) => fn(context))
    } else if (fn) {
      fn(context)
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
