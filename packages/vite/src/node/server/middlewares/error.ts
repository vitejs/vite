import chalk from 'chalk'
import { RollupError } from 'rollup'
import { ViteDevServer } from '../..'
import { Connect } from 'types/connect'
import { pad } from '../../utils'
import strip from 'strip-ansi'
import { ErrorPayload } from 'types/hmrPayload'

export function prepareError(err: Error | RollupError): ErrorPayload['err'] {
  // only copy the information we need and avoid serializing unnecessary
  // properties, since some errors may attach full objects (e.g. PostCSS)
  return {
    message: strip(err.message),
    stack: strip(err.stack || ''),
    id: (err as RollupError).id,
    frame: strip((err as RollupError).frame || ''),
    plugin: (err as RollupError).plugin,
    pluginCode: (err as RollupError).pluginCode,
    loc: (err as RollupError).loc
  }
}

export function errorMiddleware(
  server: ViteDevServer
): Connect.ErrorHandleFunction {
  // note the 4 args must be kept for connect to treat this as error middleware
  return (err: RollupError, _req, res, _next) => {
    const args = [chalk.red(`Internal server error: ${err.message}`)]
    if (err.plugin) args.push(`  Plugin: ${chalk.magenta(err.plugin)}`)
    if (err.id) args.push(`  File: ${chalk.cyan(err.id)}`)
    if (err.frame) args.push(chalk.yellow(pad(err.frame)))
    if (err.stack) args.push(pad(err.stack))

    server.config.logger.error(args.join('\n'), {
      clear: true,
      timestamp: true
    })

    res.statusCode = 500
    res.end(() => {
      server.ws.send({
        type: 'error',
        err: prepareError(err)
      })
    })
  }
}
