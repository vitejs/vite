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
    stack: strip(cleanStack(err.stack || '')),
    id: (err as RollupError).id,
    frame: strip((err as RollupError).frame || ''),
    plugin: (err as RollupError).plugin,
    pluginCode: (err as RollupError).pluginCode,
    loc: (err as RollupError).loc
  }
}

export function buildErrorMessage(
  err: RollupError,
  args: string[] = [],
  includeStack = true
): string {
  if (err.plugin) args.push(`  Plugin: ${chalk.magenta(err.plugin)}`)
  if (err.id) args.push(`  File: ${chalk.cyan(err.id)}`)
  if (err.frame) args.push(chalk.yellow(pad(err.frame)))
  if (includeStack && err.stack) args.push(pad(cleanStack(err.stack)))
  return args.join('\n')
}

function cleanStack(stack: string) {
  return stack
    .split(/\n/g)
    .filter((l) => /^\s*at/.test(l))
    .join('\n')
}

export function logError(server: ViteDevServer, err: RollupError): void {
  const msg = buildErrorMessage(err, [
    chalk.red(`Internal server error: ${err.message}`)
  ])

  server.config.logger.error(msg, {
    clear: true,
    timestamp: true,
    error: err
  })

  server.ws.send({
    type: 'error',
    err: prepareError(err)
  })
}

export function errorMiddleware(
  server: ViteDevServer,
  allowNext = false
): Connect.ErrorHandleFunction {
  // note the 4 args must be kept for connect to treat this as error middleware
  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteErrorMiddleware(err: RollupError, _req, res, next) {
    logError(server, err)

    if (allowNext) {
      next()
    } else {
      res.statusCode = 500
      res.end()
    }
  }
}
