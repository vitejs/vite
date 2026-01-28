import path from 'node:path'
import fs from 'node:fs'
import type { Connect } from '#dep-types/connect'
import { createDebugger, joinUrlSegments } from '../../utils'
import { cleanUrl } from '../../../shared/utils'
import type { DevEnvironment } from '../environment'
import { FullBundleDevEnvironment } from '../environments/fullBundleEnvironment'
import { htmlLangRE } from '../../plugins/html'

const debug = createDebugger('vite:html-fallback')

export function htmlFallbackMiddleware(
  root: string,
  spaFallback: boolean,
  clientEnvironment?: DevEnvironment,
): Connect.NextHandleFunction {
  const memoryFiles =
    clientEnvironment instanceof FullBundleDevEnvironment
      ? clientEnvironment.memoryFiles
      : undefined

  function checkFileExists(relativePath: string) {
    return (
      memoryFiles?.has(
        relativePath.slice(1), // remove first /
      ) ?? fs.existsSync(path.join(root, relativePath))
    )
  }

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

    const url = cleanUrl(req.url!)
    let pathname
    try {
      pathname = decodeURIComponent(url)
    } catch {
      // ignore malformed URI
      return next()
    }

    // .html/.htm files are not handled by serveStaticMiddleware
    // so we need to check if the file exists
    if (htmlLangRE.test(pathname)) {
      if (checkFileExists(pathname)) {
        debug?.(`Rewriting ${req.method} ${req.url} to ${url}`)
        req.url = url
        return next()
      }
    }
    // trailing slash should check for fallback index.html or index.htm
    else if (pathname.endsWith('/')) {
      const indexFile = checkFileExists(joinUrlSegments(pathname, 'index.html'))
        ? 'index.html'
        : checkFileExists(joinUrlSegments(pathname, 'index.htm'))
          ? 'index.htm'
          : null
      if (indexFile) {
        const newUrl = url + indexFile
        debug?.(`Rewriting ${req.method} ${req.url} to ${newUrl}`)
        req.url = newUrl
        return next()
      }
    }
    // non-trailing slash should check for fallback .html or .htm
    else {
      const htmlExt = checkFileExists(pathname + '.html')
        ? '.html'
        : checkFileExists(pathname + '.htm')
          ? '.htm'
          : null
      if (htmlExt) {
        const newUrl = url + htmlExt
        debug?.(`Rewriting ${req.method} ${req.url} to ${newUrl}`)
        req.url = newUrl
        return next()
      }
    }

    if (spaFallback) {
      debug?.(`Rewriting ${req.method} ${req.url} to /index.html`)
      req.url = '/index.html'
    }

    next()
  }
}
