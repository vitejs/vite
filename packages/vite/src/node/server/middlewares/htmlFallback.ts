import fs from 'node:fs'
import path from 'node:path'
import type { Connect } from 'dep-types/connect'
import { cleanUrl, createDebugger } from '../../utils'

const debug = createDebugger('vite:html-fallback')

export function htmlFallbackMiddleware(
  root: string,
  spaFallback: boolean,
  mounted = false,
): Connect.NextHandleFunction {
  // When this middleware is mounted on a route, we need to re-assign `req.url` with a
  // leading `.` to signal a relative rewrite. Returning with a leading `/` returns a
  // buggy `req.url`. e.g.:
  //
  // mount /foo/bar:
  //  req.url = /index.html
  //  final   = /foo/barindex.html
  //
  // mount /foo/bar:
  //  req.url = ./index.html
  //  final   = /foo/bar/index.html
  const prepend = mounted ? '.' : ''

  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteHtmlFallbackMiddleware(req, res, next) {
    if (
      // Only accept GET or HEAD
      (req.method !== 'GET' && req.method !== 'HEAD') ||
      // Require Accept header
      !req.headers ||
      typeof req.headers.accept !== 'string' ||
      // Ignore JSON requests
      req.headers.accept.includes('application/json') ||
      // Require Accept: text/html or */*
      !(
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
      if (fs.existsSync(filePath)) {
        debug?.(`Rewriting ${req.method} ${req.url} to ${url}`)
        req.url = prepend + url
        return next()
      }
    }
    // trailing slash should check for fallback index.html
    else if (pathname[pathname.length - 1] === '/') {
      const filePath = path.join(root, pathname, 'index.html')
      if (fs.existsSync(filePath)) {
        const newUrl = url + 'index.html'
        debug?.(`Rewriting ${req.method} ${req.url} to ${newUrl}`)
        req.url = prepend + newUrl
        return next()
      }
    }
    // non-trailing slash should check for fallback .html
    else {
      const filePath = path.join(root, pathname + '.html')
      if (fs.existsSync(filePath)) {
        const newUrl = url + '.html'
        debug?.(`Rewriting ${req.method} ${req.url} to ${newUrl}`)
        req.url = prepend + newUrl
        return next()
      }
    }

    if (spaFallback) {
      debug?.(`Rewriting ${req.method} ${req.url} to /index.html`)
      req.url = prepend + '/index.html'
    }

    next()
  }
}
