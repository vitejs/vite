import path from 'node:path'
import colors from 'picocolors'
import type { Connect } from 'dep-types/connect'

import type { ResolvedConfig } from '../../config'
import { createDebugger } from '../../utils'
import type { FsUtils } from '../../fsUtils'
import { commonFsUtils } from '../../fsUtils'
import { cleanUrl } from '../../../shared/utils'

const debug = createDebugger('vite:html-fallback')

export function htmlFallbackMiddleware(
  root: string,
  config: ResolvedConfig,
  fsUtils: FsUtils = commonFsUtils,
): Connect.NextHandleFunction {
  const spaFallback = config.appType === 'spa'
  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteHtmlFallbackMiddleware(req, res, next) {
    if (
      // Only accept GET or HEAD
      (req.method !== 'GET' && req.method !== 'HEAD') ||
      // Exclude default favicon requests
      req.url === '/favicon.ico' ||
      // Require Accept: text/html or */*
      !(
        req.headers.accept === undefined || // equivalent to `Accept: */*`
        req.headers.accept === '' || // equivalent to `Accept: */*`
        req.headers.accept.includes('text/html') ||
        req.headers.accept.includes('*/*')
      )
    ) {
      return next()
    }

    const url = cleanUrl(req.url!)
    const pathname = decodeURIComponent(url)

    // .html files are not handled by serveStaticMiddleware
    // so we need to check if the file exists
    if (pathname.endsWith('.html')) {
      const filePath = path.join(root, pathname)
      if (fsUtils.existsSync(filePath)) {
        debug?.(`Rewriting ${req.method} ${req.url} to ${url}`)
        req.url = url
        return next()
      }
    }
    // trailing slash should check for fallback index.html
    else if (pathname[pathname.length - 1] === '/') {
      const filePath = path.join(root, pathname, 'index.html')
      if (fsUtils.existsSync(filePath)) {
        const newUrl = url + 'index.html'
        debug?.(`Rewriting ${req.method} ${req.url} to ${newUrl}`)
        req.url = newUrl
        return next()
      }
    }
    // non-trailing slash should check for fallback .html
    else {
      const filePath = path.join(root, pathname + '.html')
      if (fsUtils.existsSync(filePath)) {
        const newUrl = url + '.html'
        debug?.(`Rewriting ${req.method} ${req.url} to ${newUrl}`)
        req.url = newUrl
        return next()
      }
    }

    if (spaFallback) {
      const info = `Rewriting ${req.method} ${req.url} to /index.html`
      debug?.(info)
      config.logger.warn(colors.yellow(info))
      req.url = '/index.html'
    }

    next()
  }
}
