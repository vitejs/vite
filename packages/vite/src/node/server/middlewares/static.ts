import os from 'os'
import path from 'path'
import sirv from 'sirv'
import { Connect } from 'types/connect'
import { ResolvedConfig } from '../..'
import { FS_PREFIX } from '../../constants'
import { cleanUrl, isImportRequest } from '../../utils'
const sirvOptions = { dev: true, etag: true }

export function serveStaticMiddleware(
  dir: string,
  config?: ResolvedConfig
): Connect.NextHandleFunction {
  const serve = sirv(dir, sirvOptions)

  return (req, res, next) => {
    const url = req.url!

    // skip import request
    if (isImportRequest(url)) {
      return next()
    }

    // only serve the file if it's not an html request
    // so that html requests can fallthrough to our html middleware for
    // special processing
    if (
      req.headers.accept?.includes('text/html') ||
      path.extname(cleanUrl(url)) === '.html'
    ) {
      return next()
    }

    // apply aliases to static requests as well
    if (config) {
      let redirected: string | undefined
      for (const { find, replacement } of config.alias) {
        const matches =
          typeof find === 'string' ? url.startsWith(find) : find.test(url)
        if (matches) {
          redirected = url.replace(find, replacement)
          break
        }
      }
      if (redirected) {
        // dir is pre-normalized to posix style
        if (redirected.startsWith(dir)) {
          redirected = redirected.slice(dir.length)
        }
        req.url = redirected
      }
    }

    serve(req, res, next)
  }
}

export function rawFsStaticMiddleware(): Connect.NextHandleFunction {
  const fsRoot =
    os.platform() == 'win32' ? process.cwd().split(path.sep)[0] : '/'
  const serveFromRoot = sirv(fsRoot, sirvOptions)

  return (req, res, next) => {
    const url = req.url!
    // In some cases (e.g. linked monorepos) files outside of root will
    // reference assets that are also out of served root. In such cases
    // the paths are rewritten to `/@fs/` prefixed paths and must be served by
    // searching based from fs root.
    if (url.startsWith(FS_PREFIX)) {
      req.url = url.slice(FS_PREFIX.length)
      serveFromRoot(req, res, next)
    } else {
      next()
    }
  }
}
