import path from 'node:path'
import fs from 'node:fs'
import type { Connect } from 'dep-types/connect'
import { createDebugger } from '../../utils'
import { cleanUrl } from '../../../shared/utils'

const debug = createDebugger('vite:html-fallback')

export function htmlFallbackMiddleware(
  root: string,
  spaFallback: boolean,
): Connect.NextHandleFunction {
  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteHtmlFallbackMiddleware(req, _res, next) {
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

    const { url, pathname } = normalizeIndexHtmlUrl(req.url!)

    // .html files are not handled by serveStaticMiddleware
    // so we need to check if the file exists
    if (fs.existsSync(path.join(root, pathname))) {
      debug?.(`Rewriting ${req.method} ${req.url} to ${url}`)
      req.url = url
    } else if (spaFallback) {
      debug?.(`Rewriting ${req.method} ${req.url} to /index.html`)
      req.url = '/index.html'
    }

    next()
  }
}

export function normalizeIndexHtmlUrl(url: string): {
  url: string
  pathname: string
} {
  url = cleanUrl(url)
  let pathname = decodeURIComponent(url)

  if (pathname.endsWith('.html')) {
    return { url, pathname }
  }
  // trailing slash should check for fallback index.html
  else if (pathname[pathname.length - 1] === '/') {
    pathname += 'index.html'
    url += 'index.html'
    return { url, pathname }
  }
  // non-trailing slash should check for fallback .html
  else {
    pathname += '.html'
    url += '.html'
    return { url, pathname }
  }
}
