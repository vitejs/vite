import colors from 'picocolors'
import type { RollupError } from 'rollup'
import type { Connect } from 'types/connect'
import strip from 'strip-ansi'
import type { ErrorPayload } from 'types/hmrPayload'
import { pad } from '../../utils'
import type { ViteDevServer } from '../..'

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
  if (err.plugin) args.push(`  Plugin: ${colors.magenta(err.plugin)}`)
  if (err.id) args.push(`  File: ${colors.cyan(err.id)}`)
  if (err.frame) args.push(colors.yellow(pad(err.frame)))
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
    colors.red(`Internal server error: ${err.message}`)
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
      res.end(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <title>Error</title>
            <script type="module">
              import { ErrorOverlay } from '/@vite/client'
              document.body.appendChild(new ErrorOverlay(${JSON.stringify(
                prepareError(err)
              ).replace(/</g, '\\u003c')}))
            </script>
          </head>
          <body>
          </body>
        </html>
      `)
    }
  }
}
