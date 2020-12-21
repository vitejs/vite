import chalk from 'chalk'
import os from 'os'
import path from 'path'
import sirv from 'sirv'
import { Connect } from 'types/connect'
import { FILE_PREFIX } from '../../constants'
import { Logger } from '../../logger'
import { cleanUrl } from '../../utils'

export function serveStaticMiddleware(
  dir: string,
  logger: Logger
): Connect.NextHandleFunction {
  const serve = sirv(dir, { dev: true, etag: true })
  const serveFromPublic = sirv(path.join(dir, 'public'), {
    dev: true,
    etag: true
  })

  const fsRoot =
    os.platform() == 'win32' ? process.cwd().split(path.sep)[0] : '/'
  const serveFromRoot = sirv(fsRoot, { dev: true, etag: true })

  return (req, res, next) => {
    const url = req.url!

    // In some cases (e.g. linked monorepos) files outside of root will
    // reference assets that are also out of served root. In such cases
    // the paths are rewritten to `/@fs/` prefixed paths and must be served by
    // searching based from fs root.
    if (url.startsWith(FILE_PREFIX)) {
      req.url = url.slice(FILE_PREFIX.length)
      return serveFromRoot(req, res, next)
    }

    // warn explicit /public/ paths
    if (url.startsWith('/public/')) {
      logger.warn(
        chalk.yellow(
          `[vite] files in the public directory are served at the root path.\n` +
            `Instead of ${chalk.cyan(url)}, use ${chalk.cyan(
              url.replace(/^\/public\//, '/')
            )}.`
        )
      )
    }

    const ext = path.extname(cleanUrl(url))
    // only serve the file if it's not an html request
    // so that html requests can fallthrough to our html middleware for
    // special processing
    if (ext && ext !== `.html`) {
      serve(req, res, () => {
        // fallback to public
        serveFromPublic(req, res, next)
      })
    } else {
      next()
    }
  }
}
