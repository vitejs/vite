import path from 'node:path'
import { stripVTControlCharacters as strip } from 'node:util'
import colors from 'picocolors'
import type { RollupError } from 'rollup'
import type { Connect } from 'dep-types/connect'
import type { ErrorPayload } from 'types/hmrPayload'
import { pad } from '../../utils'
import type { ViteDevServer } from '../..'
import { CLIENT_ERROR_RELAY_PATH } from '../../constants'

export function prepareError(err: Error | RollupError): ErrorPayload['err'] {
  // only copy the information we need and avoid serializing unnecessary
  // properties, since some errors may attach full objects (e.g. PostCSS)
  return {
    message: strip(err.message),
    stack: strip(cleanStack(err.stack || '')),
    id: (err as RollupError).id,
    frame: strip((err as RollupError).frame || ''),
    plugin: (err as RollupError).plugin,
    pluginCode: (err as RollupError).pluginCode?.toString(),
    loc: (err as RollupError).loc,
  }
}

export function buildErrorMessage(
  err: RollupError,
  args: string[] = [],
  includeStack = true,
): string {
  if (err.plugin) args.push(`  Plugin: ${colors.magenta(err.plugin)}`)
  const loc = err.loc ? `:${err.loc.line}:${err.loc.column}` : ''
  if (err.id) args.push(`  File: ${colors.cyan(err.id)}${loc}`)
  if (err.frame) args.push(colors.yellow(pad(err.frame)))
  if (includeStack && err.stack) args.push(pad(cleanStack(err.stack)))
  return args.join('\n')
}

function cleanStack(stack: string) {
  return stack
    .split(/\n/)
    .filter((l) => /^\s*at/.test(l))
    .join('\n')
}

export function logError(server: ViteDevServer, err: any): void {
  const msg = buildErrorMessage(err, [
    colors.red(`Client error: ${err.message}`),
  ])

  server.config.logger.error(msg, {
    clear: true,
    timestamp: true,
    error: err,
  })

  server.environments.client.hot.send({
    type: 'error',
    err: prepareError(err),
  })
}

export function errorIngestMiddleware(
  server: ViteDevServer,
): Connect.ErrorHandleFunction {
  return function viteErrorIngestMiddleware(req, res, next) {
    if (req.url === CLIENT_ERROR_RELAY_PATH) {
      console.log('req', req)
      req.statusCode = 201
      req.end('')
    } else {
      next()
    }
  }
}
