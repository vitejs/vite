import path from 'path'
import sirv from 'sirv'
import connect from 'connect'
import compression from 'compression'
import { Server } from 'http'
import { ResolvedConfig, ServerOptions } from '.'
import { Connect } from 'types/connect'
import {
  resolveHttpsConfig,
  resolveHttpServer,
  httpServerStart
} from './server/http'
import { openBrowser } from './server/openBrowser'
import corsMiddleware from 'cors'
import { proxyMiddleware } from './server/middlewares/proxy'
import { resolveHostname } from './utils'

/**
 * Starts the Vite server in preview mode, to simulate a production deployment
 * @param config - the resolved Vite config
 * @param serverOptions - what host and port to use
 * @experimental
 */
export async function preview(
  config: ResolvedConfig,
  serverOptions: Pick<ServerOptions, 'port' | 'host'>
): Promise<Server> {
  const app = connect() as Connect.Server
  const httpServer = await resolveHttpServer(
    config.server,
    app,
    await resolveHttpsConfig(config)
  )

  // cors
  const { cors } = config.server
  if (cors !== false) {
    app.use(corsMiddleware(typeof cors === 'boolean' ? {} : cors))
  }

  // proxy
  if (config.server.proxy) {
    app.use(proxyMiddleware(httpServer, config))
  }

  app.use(compression())

  const distDir = path.resolve(config.root, config.build.outDir)
  app.use(
    config.base,
    sirv(distDir, {
      etag: true,
      dev: true,
      single: true
    })
  )

  const options = config.server
  const hostname = resolveHostname(serverOptions.host ?? options.host)
  const port = serverOptions.port ?? 5000
  const protocol = options.https ? 'https' : 'http'
  const logger = config.logger
  const base = config.base

  const serverPort = await httpServerStart(httpServer, {
    port,
    strictPort: options.strictPort,
    host: hostname.host,
    logger
  })

  if (options.open) {
    const path = typeof options.open === 'string' ? options.open : base
    openBrowser(
      path.startsWith('http')
        ? path
        : `${protocol}://${hostname.name}:${serverPort}${path}`,
      true,
      logger
    )
  }

  return httpServer
}
