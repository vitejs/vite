import os from 'os'
import path from 'path'
import sirv from 'sirv'
import { Connect } from 'types/connect'
import { FILE_PREFIX } from '../../constants'

export function serveStaticMiddleware(dir: string): Connect.NextHandleFunction {
  const serve = sirv(dir, { dev: true, etag: true })
  return (req, res, next) => {
    const ext = path.extname(req.url!)
    // only serve the file if it's not an html request
    // so that html requests can fallthrough to our html middleware for
    // special processing
    if (ext && ext !== `.html`) {
      serve(req, res, next)
    } else {
      next()
    }
  }
}

/**
 * In some cases (e.g. linked monorepos) files outside of root will
 * reference assets that are also out of served root. In such cases
 * the paths are rewritten to `/@fs/` prefixed paths and served with
 * special handling.
 */
export function outOfRootStaticMiddleware(): Connect.NextHandleFunction {
  const fsRoot =
    os.platform() == 'win32' ? process.cwd().split(path.sep)[0] : '/'
  const serve = sirv(fsRoot, { dev: true, etag: true })
  return (req, res, next) => {
    if (req.url!.startsWith(FILE_PREFIX)) {
      req.url = req.url!.slice(FILE_PREFIX.length)
      serve(req, res, next)
    } else {
      next()
    }
  }
}
