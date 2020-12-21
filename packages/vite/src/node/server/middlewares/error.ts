import chalk from 'chalk'
import { RollupError } from 'rollup'
import { ViteDevServer } from '../..'
import { Connect } from 'types/connect'
import { pad } from '../../utils'
import strip from 'strip-ansi'

export function errorMiddleware(
  server: ViteDevServer
): Connect.ErrorHandleFunction {
  // note the 4 args must be kept for connect to treat this as error middleware
  return (err: RollupError, _req, res, _next) => {
    const logError = server.config.logger.error
    logError(chalk.red(`[vite] Internal server error:`))
    if (err.plugin) logError(`  Plugin: ${chalk.green(err.plugin)}`)
    if (err.id) logError(`  File: ${chalk.cyan(err.id)}`)
    if (err.frame) logError(chalk.yellow(pad(err.frame)))
    if (err.stack) logError(pad(err.stack))

    res.statusCode = 500
    res.end(() => {
      server.ws.send({
        type: 'error',
        err: {
          ...err,
          message: strip(err.message),
          stack: strip(err.stack || ''),
          frame: strip(err.frame || '')
        }
      })
    })
  }
}
