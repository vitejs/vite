import { hostValidationMiddleware as originalHostValidationMiddleware } from 'host-validation-middleware'
import type { Connect } from '#dep-types/connect'
import type { ResolvedPreviewOptions, ResolvedServerOptions } from '../..'
import { getEffectiveHost } from '../forwardedHeaders'

export function getAdditionalAllowedHosts(
  resolvedServerOptions: Pick<ResolvedServerOptions, 'host' | 'hmr' | 'origin'>,
  resolvedPreviewOptions: Pick<ResolvedPreviewOptions, 'host'>,
): string[] {
  const list = []

  // allow host option by default as that indicates that the user is
  // expecting Vite to respond on that host
  if (
    typeof resolvedServerOptions.host === 'string' &&
    resolvedServerOptions.host
  ) {
    list.push(resolvedServerOptions.host)
  }
  if (
    typeof resolvedServerOptions.hmr === 'object' &&
    resolvedServerOptions.hmr.host
  ) {
    list.push(resolvedServerOptions.hmr.host)
  }
  if (
    typeof resolvedPreviewOptions.host === 'string' &&
    resolvedPreviewOptions.host
  ) {
    list.push(resolvedPreviewOptions.host)
  }

  // allow server origin by default as that indicates that the user is
  // expecting Vite to respond on that host
  if (resolvedServerOptions.origin) {
    // some frameworks may pass the origin as a placeholder, so it's not
    // possible to parse as URL, so use a try-catch here as a best effort
    try {
      const serverOriginUrl = new URL(resolvedServerOptions.origin)
      list.push(serverOriginUrl.hostname)
    } catch {}
  }

  return list
}

export function hostValidationMiddleware(
  allowedHosts: string[],
  isPreview: boolean,
  trustProxy: boolean = false,
): Connect.NextHandleFunction {
  const validateHost = originalHostValidationMiddleware({
    // Freeze the array to allow caching
    allowedHosts: Object.freeze([...allowedHosts]),
    generateErrorMessage(hostname) {
      const hostnameWithQuotes = JSON.stringify(hostname)
      const optionName = `${isPreview ? 'preview' : 'server'}.allowedHosts`
      return (
        `Blocked request. This host (${hostnameWithQuotes}) is not allowed.\n` +
        `To allow this host, add ${hostnameWithQuotes} to \`${optionName}\` in vite.config.js.`
      )
    },
  })

  // If trustProxy is not enabled, use the original middleware directly
  if (!trustProxy) {
    return validateHost
  }

  // Wrap middleware to use forwarded host for validation
  return (req, res, next) => {
    const effectiveHost = getEffectiveHost(req, true)
    const originalHost = req.headers.host

    // Temporarily set the effective host for validation
    if (effectiveHost && effectiveHost !== originalHost) {
      req.headers.host = effectiveHost
    }

    validateHost(req, res, (err) => {
      // Restore original host header
      if (effectiveHost && effectiveHost !== originalHost) {
        req.headers.host = originalHost
      }
      next(err)
    })
  }
}
