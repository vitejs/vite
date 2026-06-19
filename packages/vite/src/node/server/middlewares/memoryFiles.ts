import * as mrmime from 'mrmime'
import type { Connect } from '#dep-types/connect'
import { cleanUrl } from '../../../shared/utils'
import type { ViteDevServer } from '..'

export function memoryFilesMiddleware(
  server: ViteDevServer,
): Connect.NextHandleFunction {
  const memoryFiles = server.environments.client.bundledDev?.memoryFiles
  if (!memoryFiles) {
    throw new Error('memoryFilesMiddleware can only be used for fullBundleMode')
  }
  const headers = server.config.server.headers

  return function viteMemoryFilesMiddleware(req, res, next) {
    const cleanedUrl = cleanUrl(req.url!)
    if (cleanedUrl.endsWith('.html')) {
      return next()
    }

    let pathname
    try {
      pathname = decodeURIComponent(cleanedUrl)
    } catch {
      // ignore malformed URI
      return next()
    }
    const filePath = pathname.slice(1) // remove first /

    const file = memoryFiles.get(filePath)
    if (file) {
      if (file.etag) {
        if (req.headers['if-none-match'] === file.etag) {
          res.statusCode = 304
          res.end()
          return
        }
        res.setHeader('Etag', file.etag)
      }

      const mime = mrmime.lookup(filePath)
      if (mime) {
        res.setHeader('Content-Type', mime)
      }

      for (const name in headers) {
        res.setHeader(name, headers[name]!)
      }

      return res.end(file.source)
    }
    next()
  }
}
