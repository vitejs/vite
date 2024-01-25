import type { Connect } from 'dep-types/connect'

export function notFoundMiddleware(): Connect.NextHandleFunction {
  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function vite404Middleware(_, res) {
    res.statusCode = 404
    res.end()
  }
}
