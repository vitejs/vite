import path from 'path'
import sirv from 'sirv'
import chalk from 'chalk'
import connect from 'connect'
import compression from 'compression'
import { ResolvedConfig } from '.'
import { Connect } from 'types/connect'
import { resolveHttpServer } from './server/http'
import { openBrowser } from './server/openBrowser'
import corsMiddleware from 'cors'
import { proxyMiddleware } from './server/middlewares/proxy'
import { printServerUrls } from './logger'

export async function preview(
  config: ResolvedConfig,
  port = 5000
): Promise<void> {
  const app = connect() as Connect.Server
  const httpServer = await resolveHttpServer(config.server, app)

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
      single: true
    })
  )

  const options = config.server || {}
  let hostname: string | undefined
  if (options.host === undefined || options.host === 'localhost') {
    // Use a secure default
    hostname = '127.0.0.1'
  } else if (options.host === true) {
    // The user probably passed --host in the CLI, without arguments
    hostname = undefined // undefined typically means 0.0.0.0 or :: (listen on all IPs)
  } else {
    hostname = options.host as string
  }
  const protocol = options.https ? 'https' : 'http'
  const logger = config.logger
  const base = config.base

  httpServer.listen(port, hostname, () => {
    logger.info(
      chalk.cyan(`\n  vite v${require('vite/package.json').version}`) +
        chalk.green(` build preview server running at:\n`)
    )

    printServerUrls(hostname, protocol, port, base, logger.info)

    if (options.open) {
      const path = typeof options.open === 'string' ? options.open : base
      openBrowser(`${protocol}://${hostname}:${port}${path}`, true, logger)
    }
  })
}
