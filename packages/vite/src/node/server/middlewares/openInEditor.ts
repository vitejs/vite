import type * as http from 'node:http'
import launchEditorMiddleware from 'launch-editor-middleware'
import type { Connect } from '#dep-types/connect'

export function isCrossSiteRequest(req: http.IncomingMessage): boolean {
  const site = req.headers['sec-fetch-site']
  if (site !== undefined) {
    // Reject only genuinely cross-site requests (a different site, e.g. a page
    // the developer happens to be visiting). `same-origin` (Vite's own client),
    // `same-site` (e.g. another local dev port — the port is not part of the
    // site) and `none` (a direct user navigation) are allowed, so cross-port
    // local dev setups keep working.
    return site === 'cross-site'
  }
  // Fallback for clients that do not send `Sec-Fetch-Site`: compare the `Origin`
  // hostname, ignoring the port so cross-port local dev still works. A request
  // with no `Origin` is a non-browser client and cannot be a CSRF vector.
  const origin = req.headers.origin
  if (origin === undefined) return false
  if (origin === 'null') return true
  const host = req.headers.host
  if (host === undefined) return true
  try {
    return new URL(origin).hostname !== new URL(`http://${host}`).hostname
  } catch {
    return true
  }
}

// The editor-launch endpoint (`/__open-in-editor`) opens the developer's
// configured editor on a caller-supplied file path. Guard it against cross-site
// requests so a page the developer visits cannot trigger it, while leaving
// same-origin and cross-port local dev requests working.
export function openInEditorMiddleware(): Connect.NextHandleFunction {
  const launchEditor = launchEditorMiddleware()
  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteOpenInEditorMiddleware(req, res) {
    if (isCrossSiteRequest(req)) {
      res.statusCode = 403
      res.end('Forbidden: cross-site request to /__open-in-editor')
      return
    }
    launchEditor(req, res)
  }
}
