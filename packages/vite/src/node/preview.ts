import path from 'path'
import sirv from 'sirv'
import chalk from 'chalk'
import connect from 'connect'
import compression from 'compression'
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
import { printServerUrls } from './logger'
import { resolveHostname } from './utils'

export async function preview(
  config: ResolvedConfig,
  serverOptions: Pick<ServerOptions, 'port' | 'host'>
): Promise<void> {
  const app = connect() as Connect.Server
  const httpServer = await resolveHttpServer(
    config.server,
    app,
    await resolveHttpsConfig(config)
  )

  // cors
  if (config.server.cors !== false) {
    app.use(
      corsMiddleware(
        typeof config.server.cors === 'boolean' ? {} : config.server.cors
      )
    )
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
      dev: !config.isProduction,
      single: true
    })
  )

  const options = config.server
  const hostname = resolveHostname(serverOptions.host ?? options.host)
  const port = serverOptions.port ?? 5000
  const protocol = options.https ? 'https' : 'http'

  const serverPort = await httpServerStart(httpServer, {
    port,
    strictPort: options.strictPort,
    host: hostname.host,
    logger: config.logger
  })

  config.logger.info(
    chalk.cyan(`\n  vite v${require('vite/package.json').version}`) +
      chalk.green(` build preview server running at:\n`)
  )

  printServerUrls(
    hostname,
    protocol,
    serverPort,
    config.base,
    config.logger.info
  )

  if (options.open) {
    const path = typeof options.open === 'string' ? options.open : config.base
    openBrowser(
      `${protocol}://${hostname.name}:${serverPort}${path}`,
      true,
      config.logger
    )
  }
}
