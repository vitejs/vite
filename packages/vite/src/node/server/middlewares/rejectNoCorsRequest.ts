import type { Connect } from '#dep-types/connect'
import type { CorsOptions } from '../../http'

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
export function rejectNoCorsRequestMiddleware(
  cors: CorsOptions | boolean,
): Connect.NextHandleFunction {
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
      // If the CORS config allows this origin, let the request through
      if (isOriginAllowedByCors(req.headers.origin, cors)) {
        return next()
      }

      res.statusCode = 403
      res.end(
        'Cross-origin requests for classic scripts must be made with CORS mode enabled. Make sure to set the "crossorigin" attribute on your <script> tag.',
      )
      return
    }
    return next()
  }
}

function isOriginAllowedByCors(
  origin: string | undefined,
  cors: CorsOptions | boolean,
): boolean {
  if (cors === false) return false
  // cors: true translates to corsMiddleware({}) which allows all origins
  if (cors === true) return true

  const configuredOrigin = cors.origin
  // No origin configured means cors npm package defaults to '*' (allow all)
  if (configuredOrigin === undefined || configuredOrigin === true) return true
  if (configuredOrigin === false) return false

  // Can't verify without an Origin header
  if (!origin) return false

  if (typeof configuredOrigin === 'string') {
    return configuredOrigin === '*' || configuredOrigin === origin
  }
  if (configuredOrigin instanceof RegExp) {
    return configuredOrigin.test(origin)
  }
  if (Array.isArray(configuredOrigin)) {
    return configuredOrigin.some((o) =>
      typeof o === 'string' ? o === origin : o.test(origin),
    )
  }
  // origin is a callback function — user has explicitly configured custom logic,
  // so we trust their intent and allow the request through
  if (typeof configuredOrigin === 'function') return true

  return false
}
