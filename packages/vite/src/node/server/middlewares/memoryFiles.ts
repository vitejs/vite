import type { Connect } from 'dep-types/connect'
import * as mrmime from 'mrmime'
import { cleanUrl } from '../../../shared/utils'
import type { ViteDevServer } from '..'
import { FullBundleDevEnvironment } from '../environments/fullBundleEnvironment'

export function memoryFilesMiddleware(
  server: ViteDevServer,
): Connect.NextHandleFunction {
  const memoryFiles =
    server.environments.client instanceof FullBundleDevEnvironment
      ? server.environments.client.memoryFiles
      : undefined
  if (!memoryFiles) {
    throw new Error('memoryFilesMiddleware can only be used for fullBundleMode')
  }
  const headers = server.config.server.headers

  return function viteMemoryFilesMiddleware(req, res, next) {
    const cleanedUrl = cleanUrl(req.url!).slice(1) // remove first /
    if (cleanedUrl.endsWith('.html')) {
      return next()
    }
    const file = memoryFiles.get(cleanedUrl)
    if (file) {
      const mime = mrmime.lookup(cleanedUrl)
      if (mime) {
        res.setHeader('Content-Type', mime)
      }

      for (const name in headers) {
        res.setHeader(name, headers[name]!)
      }

      return res.end(file)
    }
    next()
  }
}
