import type { Connect } from 'dep-types/connect'

export function rejectInvalidRequestMiddleware(): Connect.NextHandleFunction {
  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteRejectInvalidRequestMiddleware(req, res, next) {
    // HTTP spec does not allow `#` in the request-target
    // (HTTP 1.1: https://datatracker.ietf.org/doc/html/rfc9112#section-3.2)
    // (HTTP 2: https://datatracker.ietf.org/doc/html/rfc9113#section-8.3.1-2.4.1)
    // But Node.js allows those requests.
    // Our middlewares don't expect `#` to be included in `req.url`, especially the `server.fs.deny` checks.
    if (req.url?.includes('#')) {
      // HTTP 1.1 spec recommends sending 400 Bad Request
      // (https://datatracker.ietf.org/doc/html/rfc9112#section-3.2-4)
      res.writeHead(400)
      res.end()
      return
    }
    return next()
  }
}
