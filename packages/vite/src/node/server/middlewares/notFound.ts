import type { OutgoingHttpHeaders } from 'node:http'
import type { Connect } from '#dep-types/connect'

export function notFoundMiddleware(
  headers?: OutgoingHttpHeaders,
): Connect.NextHandleFunction {
  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function vite404Middleware(_, res) {
    if (headers) {
      for (const name in headers) {
        res.setHeader(name, headers[name]!)
      }
    }
    res.statusCode = 404
    res.end()
  }
}
