import chalk from 'chalk'
import { RollupError } from 'rollup'
import decolor from 'strip-ansi'
import { ServerContext } from '../..'
import { Connect } from '../../types/connect'
import { pad } from '../../utils'

export function errorMiddleware(
  context: ServerContext
): Connect.ErrorHandleFunction {
  // note the 4 args must be kept for connect to treat this as error middleware
  return (err: RollupError, _req, res, _next) => {
    console.error(chalk.red(`[vite] Internal server error:`))
    if (err.plugin) console.error(`  plugin: ${chalk.green(err.plugin)}`)
    if (err.id) console.error(`  file: ${chalk.cyan(err.id)}`)
    if (err.frame) console.error(chalk.yellow(pad(err.frame)))
    if (err.stack) console.error(pad(err.stack))
    context.ws.send({
      type: 'error',
      err: {
        ...err,
        message: decolor(err.message),
        stack: decolor(err.stack || '')
      }
    })
    res.statusCode = 500
    res.end()
  }
}
