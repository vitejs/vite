import type { Polka } from 'dep-types/polka'

export function notFoundMiddleware(): Polka.RequestHandler {
  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function vite404Middleware(_, res) {
    res.statusCode = 404
    res.end()
  }
}
