import type { Connect } from 'types/connect'

export function decodeURIMiddleware(): Connect.NextHandleFunction {
  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteDecodeURIMiddleware(req, _, next) {
    // #2195
    req.url = decodeURI(req.url!)
    next()
  }
}
