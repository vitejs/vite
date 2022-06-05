import path from 'path'
import type { ServerResponse } from 'http'
import type { Options } from 'sirv'
import sirv from 'sirv'
import type { Connect } from 'types/connect'
import micromatch from 'micromatch'
import type { ViteDevServer } from '../..'
import { FS_PREFIX } from '../../constants'
import {
  cleanUrl,
  fsPathFromId,
  fsPathFromUrl,
  isFileReadable,
  isImportRequest,
  isInternalRequest,
  isParentDirectory,
  isWindows,
  slash
} from '../../utils'

const { isMatch } = micromatch

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
    // skip import request and internal requests `/@fs/ /@vite-client` etc...
    if (isImportRequest(req.url!) || isInternalRequest(req.url!)) {
      return next()
    }
    serve(req, res, next)
  }
}

export function serveStaticMiddleware(
  dir: string,
  server: ViteDevServer
): Connect.NextHandleFunction {
  const serve = sirv(dir, sirvOptions)

  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteServeStaticMiddleware(req, res, next) {
    // only serve the file if it's not an html request or ends with `/`
    // so that html requests can fallthrough to our html middleware for
    // special processing
    // also skip internal requests `/@fs/ /@vite-client` etc...
    const cleanedUrl = cleanUrl(req.url!)
    if (
      cleanedUrl.endsWith('/') ||
      path.extname(cleanedUrl) === '.html' ||
      isInternalRequest(req.url!)
    ) {
      return next()
    }

    const url = decodeURI(req.url!)

    // apply aliases to static requests as well
    let redirected: string | undefined
    for (const { find, replacement } of server.config.resolve.alias) {
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
    }

    const resolvedUrl = redirected || url
    let fileUrl = path.resolve(dir, resolvedUrl.replace(/^\//, ''))
    if (resolvedUrl.endsWith('/') && !fileUrl.endsWith('/')) {
      fileUrl = fileUrl + '/'
    }
    if (!ensureServingAccess(fileUrl, server, res, next)) {
      return
    }

    if (redirected) {
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
    let url = decodeURI(req.url!)
    // In some cases (e.g. linked monorepos) files outside of root will
    // reference assets that are also out of served root. In such cases
    // the paths are rewritten to `/@fs/` prefixed paths and must be served by
    // searching based from fs root.
    if (url.startsWith(FS_PREFIX)) {
      // restrict files outside of `fs.allow`
      if (
        !ensureServingAccess(
          slash(path.resolve(fsPathFromId(url))),
          server,
          res,
          next
        )
      ) {
        return
      }

      url = url.slice(FS_PREFIX.length)
      if (isWindows) url = url.replace(/^[A-Z]:/i, '')

      req.url = url
      serveFromRoot(req, res, next)
    } else {
      next()
    }
  }
}

const _matchOptions = { matchBase: true }

export function isFileServingAllowed(
  url: string,
  server: ViteDevServer
): boolean {
  if (!server.config.server.fs.strict) return true

  const file = fsPathFromUrl(url)

  if (server.config.server.fs.deny.some((i) => isMatch(file, i, _matchOptions)))
    return false

  if (server.moduleGraph.safeModulesPath.has(file)) return true

  if (server.config.server.fs.allow.some((dir) => isParentDirectory(dir, file)))
    return true

  return false
}

function ensureServingAccess(
  url: string,
  server: ViteDevServer,
  res: ServerResponse,
  next: Connect.NextFunction
): boolean {
  if (isFileServingAllowed(url, server)) {
    return true
  }
  if (isFileReadable(cleanUrl(url))) {
    const urlMessage = `The request url "${url}" is outside of Vite serving allow list.`
    const hintMessage = `
${server.config.server.fs.allow.map((i) => `- ${i}`).join('\n')}

Refer to docs https://vitejs.dev/config/#server-fs-allow for configurations and more details.`

    server.config.logger.error(urlMessage)
    server.config.logger.warnOnce(hintMessage + '\n')
    res.statusCode = 403
    res.write(renderRestrictedErrorHTML(urlMessage + '\n' + hintMessage))
    res.end()
  } else {
    // if the file doesn't exist, we shouldn't restrict this path as it can
    // be an API call. Middlewares would issue a 404 if the file isn't handled
    next()
  }
  return false
}

function renderRestrictedErrorHTML(msg: string): string {
  // to have syntax highlighting and autocompletion in IDE
  const html = String.raw
  return html`
    <body>
      <h1>403 Restricted</h1>
      <p>${msg.replace(/\n/g, '<br/>')}</p>
      <style>
        body {
          padding: 1em 2em;
        }
      </style>
    </body>
  `
}
