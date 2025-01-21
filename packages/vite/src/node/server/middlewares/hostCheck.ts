import net from 'node:net'
import type { Connect } from 'dep-types/connect'
import type { ResolvedConfig } from '../../config'
import type { ResolvedPreviewOptions, ResolvedServerOptions } from '../..'

const allowedHostsServerCache = new WeakMap<ResolvedConfig, Set<string>>()
const allowedHostsPreviewCache = new WeakMap<ResolvedConfig, Set<string>>()

const isFileOrExtensionProtocolRE = /^(?:file|.+-extension):/i

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

// Based on webpack-dev-server's `checkHeader` function: https://github.com/webpack/webpack-dev-server/blob/v5.2.0/lib/Server.js#L3086
// https://github.com/webpack/webpack-dev-server/blob/v5.2.0/LICENSE
export function isHostAllowedWithoutCache(
  allowedHosts: string[],
  additionalAllowedHosts: string[],
  host: string,
): boolean {
  if (isFileOrExtensionProtocolRE.test(host)) {
    return true
  }

  // We don't care about malformed Host headers,
  // because we only need to consider browser requests.
  // Non-browser clients can send any value they want anyway.
  //
  // `Host = uri-host [ ":" port ]`
  const trimmedHost = host.trim()

  // IPv6
  if (trimmedHost[0] === '[') {
    const endIpv6 = trimmedHost.indexOf(']')
    if (endIpv6 < 0) {
      return false
    }
    // DNS rebinding attacks does not happen with IP addresses
    return net.isIP(trimmedHost.slice(1, endIpv6)) === 6
  }

  // uri-host does not include ":" unless IPv6 address
  const colonPos = trimmedHost.indexOf(':')
  const hostname =
    colonPos === -1 ? trimmedHost : trimmedHost.slice(0, colonPos)

  // DNS rebinding attacks does not happen with IP addresses
  if (net.isIP(hostname) === 4) {
    return true
  }

  // allow localhost and .localhost by default as they always resolve to the loopback address
  // https://datatracker.ietf.org/doc/html/rfc6761#section-6.3
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return true
  }

  for (const additionalAllowedHost of additionalAllowedHosts) {
    if (additionalAllowedHost === hostname) {
      return true
    }
  }

  for (const allowedHost of allowedHosts) {
    if (allowedHost === hostname) {
      return true
    }

    // allow all subdomains of it
    // e.g. `.foo.example` will allow `foo.example`, `*.foo.example`, `*.*.foo.example`, etc
    if (
      allowedHost[0] === '.' &&
      (allowedHost.slice(1) === hostname || hostname.endsWith(allowedHost))
    ) {
      return true
    }
  }

  return false
}

/**
 * @param config resolved config
 * @param isPreview whether it's for the preview server or not
 * @param host the value of host header. See [RFC 9110 7.2](https://datatracker.ietf.org/doc/html/rfc9110#name-host-and-authority).
 */
export function isHostAllowed(
  config: ResolvedConfig,
  isPreview: boolean,
  host: string,
): boolean {
  const allowedHosts = isPreview
    ? config.preview.allowedHosts
    : config.server.allowedHosts
  if (allowedHosts === true) {
    return true
  }

  const cache = isPreview ? allowedHostsPreviewCache : allowedHostsServerCache
  if (!cache.has(config)) {
    cache.set(config, new Set())
  }

  const cachedAllowedHosts = cache.get(config)!
  if (cachedAllowedHosts.has(host)) {
    return true
  }

  const result = isHostAllowedWithoutCache(
    allowedHosts,
    config.additionalAllowedHosts,
    host,
  )
  if (result) {
    cachedAllowedHosts.add(host)
  }
  return result
}

export function hostCheckMiddleware(
  config: ResolvedConfig,
  isPreview: boolean,
): Connect.NextHandleFunction {
  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteHostCheckMiddleware(req, res, next) {
    const hostHeader = req.headers.host
    if (!hostHeader || !isHostAllowed(config, isPreview, hostHeader)) {
      const hostname = hostHeader?.replace(/:\d+$/, '')
      const hostnameWithQuotes = JSON.stringify(hostname)
      const optionName = `${isPreview ? 'preview' : 'server'}.allowedHosts`
      res.writeHead(403, {
        'Content-Type': 'text/plain',
      })
      res.end(
        `Blocked request. This host (${hostnameWithQuotes}) is not allowed.\n` +
          `To allow this host, add ${hostnameWithQuotes} to \`${optionName}\` in vite.config.js.`,
      )
      return
    }
    return next()
  }
}
