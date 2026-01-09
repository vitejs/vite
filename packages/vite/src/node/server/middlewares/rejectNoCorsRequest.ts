import type { Connect } from '#dep-types/connect'

/**
 * A middleware that rejects no-cors mode requests that are not same-origin.
 *
 * We should avoid untrusted sites to load the script to avoid attacks like GHSA-4v9v-hfq4-rm2v.
 * This is because:
 * - the path of HMR patch files / entry point files can be predictable
 * - the HMR patch files may not include ESM syntax
 *   (if they include ESM syntax, loading as a classic script would fail)
 * - the HMR runtime in the browser has the list of all loaded modules
 *
 * https://github.com/webpack/webpack-dev-server/security/advisories/GHSA-4v9v-hfq4-rm2v
 * https://green.sapphi.red/blog/local-server-security-best-practices#_2-using-xssi-and-modifying-the-prototype
 * https://green.sapphi.red/blog/local-server-security-best-practices#properly-check-the-request-origin
 */
export function rejectNoCorsRequestMiddleware(): Connect.NextHandleFunction {
  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteRejectNoCorsRequestMiddleware(req, res, next) {
    // While we can set Cross-Origin-Resource-Policy header instead of rejecting requests,
    // we choose to reject the request to be safer in case the request handler has any side-effects.
    if (
      req.headers['sec-fetch-mode'] === 'no-cors' &&
      req.headers['sec-fetch-site'] !== 'same-origin' &&
      // we only need to block classic script requests
      req.headers['sec-fetch-dest'] === 'script'
    ) {
      res.statusCode = 403
      res.end(
        'Cross-origin requests for classic scripts must be made with CORS mode enabled. Make sure to set the "crossorigin" attribute on your <script> tag.',
      )
      return
    }
    return next()
  }
}
