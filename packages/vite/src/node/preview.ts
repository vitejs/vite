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
  const {
    root,
    base,
    server: serverConfig,
    build,
    logger,
    isProduction
  } = config
  const {
    cors,
    strictPort,
    https,
    open,
    host: serverConfigHost,
    proxy
  } = serverConfig
  const { host: serverOptionHost, port: serverOptionPort } = serverOptions

  const httpServer = await resolveHttpServer(
    serverConfig,
    app,
    await resolveHttpsConfig(config)
  )

  // cors
  if (cors !== false) {
    app.use(corsMiddleware(typeof cors === 'boolean' ? {} : cors))
  }

  // proxy
  if (proxy) {
    app.use(proxyMiddleware(httpServer, config))
  }

  app.use(compression())

  const distDir = path.resolve(root, build.outDir)
  app.use(
    base,
    sirv(distDir, {
      etag: true,
      dev: !isProduction,
      single: true
    })
  )

  const hostname = resolveHostname(serverOptionHost ?? serverConfigHost)
  const port = serverOptionPort ?? 5000
  const protocol = https ? 'https' : 'http'

  const serverPort = await httpServerStart(httpServer, {
    port,
    strictPort,
    host: hostname.host,
    logger
  })

  logger.info(
    chalk.cyan(`\n  vite v${require('vite/package.json').version}`) +
      chalk.green(` build preview server running at:\n`)
  )

  printServerUrls(hostname, protocol, serverPort, base, logger.info)

  if (open) {
    const path = typeof open === 'string' ? open : base
    openBrowser(
      `${protocol}://${hostname.name}:${serverPort}${path}`,
      true,
      logger
    )
  }
}
