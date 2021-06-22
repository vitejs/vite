import path from 'path'
import sirv, { Options } from 'sirv'
import { Connect } from 'types/connect'
import { FileSystemServeOptions } from '..'
import { normalizePath, ResolvedConfig } from '../..'
import { FS_PREFIX } from '../../constants'
import { Logger } from '../../logger'
import { cleanUrl, fsPathFromId, isImportRequest, isWindows } from '../../utils'
import { AccessRestrictedError } from './error'

const sirvOptions: Options = {
  dev: true,
  etag: true,
  extensions: [],
  setHeaders(res, pathname) {
    // Matches js, jsx, ts, tsx.
    // The reason this is done, is that the .ts file extension is reserved
    // for the MIME type video/mp2t. In almost all cases, we can expect
    // these files to be TypeScript files, and for Vite to serve them with
    // this Content-Type.
    if (/\.[tj]sx?$/.test(pathname)) {
      res.setHeader('Content-Type', 'application/javascript')
    }
  }
}

export function servePublicMiddleware(dir: string): Connect.NextHandleFunction {
  const serve = sirv(dir, sirvOptions)

  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteServePublicMiddleware(req, res, next) {
    // skip import request
    if (isImportRequest(req.url!)) {
      return next()
    }
    serve(req, res, next)
  }
}

export function serveStaticMiddleware(
  dir: string,
  config: ResolvedConfig
): Connect.NextHandleFunction {
  const serve = sirv(dir, sirvOptions)

  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteServeStaticMiddleware(req, res, next) {
    const url = req.url!

    // only serve the file if it's not an html request
    // so that html requests can fallthrough to our html middleware for
    // special processing
    if (path.extname(cleanUrl(url)) === '.html') {
      return next()
    }

    // apply aliases to static requests as well
    let redirected: string | undefined
    for (const { find, replacement } of config.resolve.alias) {
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

    serve(req, res, next)
  }
}

export function serveRawFsMiddleware(
  config: ResolvedConfig
): Connect.NextHandleFunction {
  const serveFromRoot = sirv('/', sirvOptions)

  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteServeRawFsMiddleware(req, res, next) {
    let url = req.url!
    // In some cases (e.g. linked monorepos) files outside of root will
    // reference assets that are also out of served root. In such cases
    // the paths are rewritten to `/@fs/` prefixed paths and must be served by
    // searching based from fs root.
    if (url.startsWith(FS_PREFIX)) {
      // restrict files outside of `fsServe.root`
      ensureServingAccess(
        path.resolve(fsPathFromId(url)),
        config.server.fsServe,
        config.logger
      )

      url = url.slice(FS_PREFIX.length)
      if (isWindows) url = url.replace(/^[A-Z]:/i, '')

      req.url = url
      serveFromRoot(req, res, next)
    } else {
      next()
    }
  }
}

export function isFileAccessAllowed(
  url: string,
  { root, strict }: Required<FileSystemServeOptions>
): boolean {
  return !strict || normalizePath(url).startsWith(root + path.posix.sep)
}

export function ensureServingAccess(
  url: string,
  serveOptions: Required<FileSystemServeOptions>,
  logger: Logger
): void {
  const { strict, root } = serveOptions
  // TODO: early return, should remove once we polished the restriction logic
  if (!strict) return

  if (!isFileAccessAllowed(url, serveOptions)) {
    const normalizedUrl = normalizePath(url)
    if (strict) {
      throw new AccessRestrictedError(
        `The request url "${normalizedUrl}" is outside of vite dev server root "${root}". 
        For security concerns, accessing files outside of workspace root is restricted since Vite v2.3.x. 
        Refer to docs https://vitejs.dev/config/#server-fsserve-root for configurations and more details.`,
        normalizedUrl,
        root
      )
    } else {
      // TODO: warn for potential unrestricted access
      logger.warnOnce(
        `For security concerns, accessing files outside of workspace root will ` +
          `be restricted by default in the future version of Vite. ` +
          `Refer to [] for more`
      )
      logger.warnOnce(`Unrestricted file system access to "${normalizedUrl}"`)
    }
  }
}
