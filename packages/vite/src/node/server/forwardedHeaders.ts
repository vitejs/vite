import type { IncomingMessage } from 'node:http'

/**
 * Get the effective host from a request, considering forwarded headers if trusted.
 *
 * When trustProxy is enabled, this function will check for X-Forwarded-Host
 * and the RFC 7239 Forwarded header to determine the original host.
 *
 * @param req - The incoming HTTP request
 * @param trustProxy - Whether to trust X-Forwarded-* headers
 * @returns The effective host header value
 */
export function getEffectiveHost(
  req: IncomingMessage,
  trustProxy: boolean,
): string | undefined {
  if (trustProxy) {
    // Try X-Forwarded-Host first (most common)
    const xForwardedHost = req.headers['x-forwarded-host']
    if (xForwardedHost) {
      const host = Array.isArray(xForwardedHost)
        ? xForwardedHost[0]
        : xForwardedHost.split(',')[0]?.trim()
      if (host) return host
    }

    // Fall back to RFC 7239 Forwarded header
    const forwarded = req.headers['forwarded']
    if (forwarded) {
      const value = Array.isArray(forwarded) ? forwarded[0] : forwarded
      // Parse host from Forwarded header (e.g., "host=example.com" or "host=\"example.com:8080\"")
      const hostMatch = value.match(/host=(?:"([^"]+)"|([^;,\s]+))/i)
      if (hostMatch) {
        return hostMatch[1] || hostMatch[2]
      }
    }
  }
  return req.headers.host
}
