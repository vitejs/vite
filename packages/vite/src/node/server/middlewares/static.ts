import path from 'path'
import sirv, { Options } from 'sirv'
import { Connect } from 'types/connect'
import { normalizePath, ResolvedConfig, ViteDevServer } from '../..'
import { FS_PREFIX } from '../../constants'
import {
  cleanUrl,
  ensureLeadingSlash,
  fsPathFromId,
  isImportRequest,
  isWindows,
  slash
} from '../../utils'
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
  server: ViteDevServer
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
      // restrict files outside of `fs.allow`
      ensureServingAccess(slash(path.resolve(fsPathFromId(url))), server)
      url = url.slice(FS_PREFIX.length)
      if (isWindows) url = url.replace(/^[A-Z]:/i, '')

      req.url = url
      serveFromRoot(req, res, next)
    } else {
      next()
    }
  }
}

export function isFileServingAllowed(
  url: string,
  server: ViteDevServer
): boolean {
  // explicitly disabled
  if (server.config.server.fs.strict === false) return true

  const file = ensureLeadingSlash(normalizePath(cleanUrl(url)))

  if (server.moduleGraph.safeModulesPath.has(file)) return true

  if (server.config.server.fs.allow.some((i) => file.startsWith(i + '/')))
    return true

  if (!server.config.server.fs.strict) {
    server.config.logger.warnOnce(`Unrestricted file system access to "${url}"`)
    server.config.logger.warnOnce(
      `For security concerns, accessing files outside of serving allow list will ` +
        `be restricted by default in the future version of Vite. ` +
        `Refer to https://vitejs.dev/config/#server-fs-allow for more details.`
    )
    return true
  }

  return false
}

export function ensureServingAccess(url: string, server: ViteDevServer): void {
  if (!isFileServingAllowed(url, server)) {
    const allow = server.config.server.fs.allow
    throw new AccessRestrictedError(
      `The request url "${url}" is outside of Vite serving allow list:

${allow.map((i) => `- ${i}`).join('\n')}

Refer to docs https://vitejs.dev/config/#server-fs-allow for configurations and more details.`
    )
  }
}
