import colors from 'picocolors'
import type { RollupError } from 'rollup'
import type { Connect } from 'dep-types/connect'
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
    .split(/\n/g)
    .filter((l) => /^\s*at/.test(l))
    .join('\n')
}

export function logError(server: ViteDevServer, err: RollupError): void {
  const msg = buildErrorMessage(err, [
    colors.red(`Internal server error: ${err.message}`),
  ])

  server.config.logger.error(msg, {
    clear: true,
    timestamp: true,
    error: err,
  })

  server.hot.send({
    type: 'error',
    err: prepareError(err),
  })
}

export function errorMiddleware(
  server: ViteDevServer,
  allowNext = false,
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
              const error = ${JSON.stringify(prepareError(err)).replace(
                /</g,
                '\\u003c',
              )}
              try {
                const { ErrorOverlay } = await import('/@vite/client')
                document.body.appendChild(new ErrorOverlay(error))
              } catch {
                const h = (tag, text) => {
                  const el = document.createElement(tag)
                  el.textContent = text
                  return el
                }
                document.body.appendChild(h('h1', 'Internal Server Error'))
                document.body.appendChild(h('h2', error.message))
                document.body.appendChild(h('pre', error.stack))
                document.body.appendChild(h('p', '(Error overlay failed to load)'))
              }
            </script>
          </head>
          <body>
          </body>
        </html>
      `)
    }
  }
}
