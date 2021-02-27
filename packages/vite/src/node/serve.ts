import chalk from 'chalk'
import connect from 'connect'
import os from 'os'
import { Connect } from 'types/connect'
import { ResolvedConfig } from '.'
import { resolveHttpServer } from './server/http'
import { createServeMiddlewares } from './server/middlewares'
import { openBrowser } from './server/openBrowser'

export async function serve(config: ResolvedConfig, port = 5000) {
  const app = connect() as Connect.Server
  const server = await resolveHttpServer(config.server, app)

  createServeMiddlewares(server, config, app)

  const options = config.server || {}
  const hostname = options.host || 'localhost'
  const protocol = options.https ? 'https' : 'http'
  const logger = config.logger
  const base = config.base

  server.listen(port, () => {
    logger.info(`\n  Build preview server running at:\n`)
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
          const url = `${protocol}://${host}:${chalk.bold(port)}${base}`
          logger.info(`  > ${type} ${chalk.cyan(url)}`)
        })
    )

    if (options.open) {
      const path = typeof options.open === 'string' ? options.open : base
      openBrowser(`${protocol}://${hostname}:${port}${path}`, true, logger)
    }
  })
}
