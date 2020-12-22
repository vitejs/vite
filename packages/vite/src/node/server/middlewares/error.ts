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
    const args = [chalk.red(`[vite] Internal server error:`)]
    if (err.plugin) args.push(`  Plugin: ${chalk.green(err.plugin)}`)
    if (err.id) args.push(`  File: ${chalk.cyan(err.id)}`)
    if (err.frame) args.push(chalk.yellow(pad(err.frame)))
    if (err.stack) args.push(pad(err.stack))

    server.config.logger.error(args.join('\n'))

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
