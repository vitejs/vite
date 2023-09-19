import path from 'node:path'
import type { OutgoingHttpHeaders, ServerResponse } from 'node:http'
import type { Options } from 'sirv'
import sirv from 'sirv'
import type { Connect } from 'dep-types/connect'
import escapeHtml from 'escape-html'
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
  isSameFileUri,
  isWindows,
  removeLeadingSlash,
  shouldServeFile,
  slash,
  withTrailingSlash,
} from '../../utils'

const knownJavascriptExtensionRE = /\.[tj]sx?$/

const sirvOptions = ({
  headers,
  shouldServe,
}: {
  headers?: OutgoingHttpHeaders
  shouldServe?: (p: string) => void
}): Options => {
  return {
    dev: true,
    etag: true,
    extensions: [],
    setHeaders(res, pathname) {
      // Matches js, jsx, ts, tsx.
      // The reason this is done, is that the .ts file extension is reserved
      // for the MIME type video/mp2t. In almost all cases, we can expect
      // these files to be TypeScript files, and for Vite to serve them with
      // this Content-Type.
      if (knownJavascriptExtensionRE.test(pathname)) {
        res.setHeader('Content-Type', 'application/javascript')
      }
      if (headers) {
        for (const name in headers) {
          res.setHeader(name, headers[name]!)
        }
      }
    },
    shouldServe,
  }
}

export function servePublicMiddleware(
  dir: string,
  headers?: OutgoingHttpHeaders,
): Connect.NextHandleFunction {
  const serve = sirv(
    dir,
    sirvOptions({
      headers,
      shouldServe: (filePath) => shouldServeFile(filePath, dir),
    }),
  )

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
  server: ViteDevServer,
): Connect.NextHandleFunction {
  const serve = sirv(
    dir,
    sirvOptions({
      headers: server.config.server.headers,
    }),
  )

  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteServeStaticMiddleware(req, res, next) {
    // only serve the file if it's not an html request or ends with `/`
    // so that html requests can fallthrough to our html middleware for
    // special processing
    // also skip internal requests `/@fs/ /@vite-client` etc...
    const cleanedUrl = cleanUrl(req.url!)
    if (
      cleanedUrl[cleanedUrl.length - 1] === '/' ||
      path.extname(cleanedUrl) === '.html' ||
      isInternalRequest(req.url!)
    ) {
      return next()
    }

    const url = new URL(req.url!.replace(/^\/{2,}/, '/'), 'http://example.com')
    const pathname = decodeURI(url.pathname)

    // apply aliases to static requests as well
    let redirectedPathname: string | undefined
    for (const { find, replacement } of server.config.resolve.alias) {
      const matches =
        typeof find === 'string'
          ? pathname.startsWith(find)
          : find.test(pathname)
      if (matches) {
        redirectedPathname = pathname.replace(find, replacement)
        break
      }
    }
    if (redirectedPathname) {
      // dir is pre-normalized to posix style
      if (redirectedPathname.startsWith(withTrailingSlash(dir))) {
        redirectedPathname = redirectedPathname.slice(dir.length)
      }
    }

    const resolvedPathname = redirectedPathname || pathname
    let fileUrl = path.resolve(dir, removeLeadingSlash(resolvedPathname))
    if (
      resolvedPathname[resolvedPathname.length - 1] === '/' &&
      fileUrl[fileUrl.length - 1] !== '/'
    ) {
      fileUrl = withTrailingSlash(fileUrl)
    }
    if (!ensureServingAccess(fileUrl, server, res, next)) {
      return
    }

    if (redirectedPathname) {
      url.pathname = encodeURI(redirectedPathname)
      req.url = url.href.slice(url.origin.length)
    }

    serve(req, res, next)
  }
}

export function serveRawFsMiddleware(
  server: ViteDevServer,
): Connect.NextHandleFunction {
  const serveFromRoot = sirv(
    '/',
    sirvOptions({ headers: server.config.server.headers }),
  )

  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteServeRawFsMiddleware(req, res, next) {
    const url = new URL(req.url!.replace(/^\/{2,}/, '/'), 'http://example.com')
    // In some cases (e.g. linked monorepos) files outside of root will
    // reference assets that are also out of served root. In such cases
    // the paths are rewritten to `/@fs/` prefixed paths and must be served by
    // searching based from fs root.
    if (url.pathname.startsWith(FS_PREFIX)) {
      const pathname = decodeURI(url.pathname)
      // restrict files outside of `fs.allow`
      if (
        !ensureServingAccess(
          slash(path.resolve(fsPathFromId(pathname))),
          server,
          res,
          next,
        )
      ) {
        return
      }

      let newPathname = pathname.slice(FS_PREFIX.length)
      if (isWindows) newPathname = newPathname.replace(/^[A-Z]:/i, '')

      url.pathname = encodeURI(newPathname)
      req.url = url.href.slice(url.origin.length)
      serveFromRoot(req, res, next)
    } else {
      next()
    }
  }
}

/**
 * Check if the url is allowed to be served, via the `server.fs` config.
 */
export function isFileServingAllowed(
  url: string,
  server: ViteDevServer,
): boolean {
  if (!server.config.server.fs.strict) return true

  const file = fsPathFromUrl(url)

  if (server._fsDenyGlob(file)) return false

  if (server.moduleGraph.safeModulesPath.has(file)) return true

  if (
    server.config.server.fs.allow.some(
      (uri) => isSameFileUri(uri, file) || isParentDirectory(uri, file),
    )
  )
    return true

  return false
}

function ensureServingAccess(
  url: string,
  server: ViteDevServer,
  res: ServerResponse,
  next: Connect.NextFunction,
): boolean {
  if (isFileServingAllowed(url, server)) {
    return true
  }
  if (isFileReadable(cleanUrl(url))) {
    const urlMessage = `The request url "${url}" is outside of Vite serving allow list.`
    const hintMessage = `
${server.config.server.fs.allow.map((i) => `- ${i}`).join('\n')}

Refer to docs https://vitejs.dev/config/server-options.html#server-fs-allow for configurations and more details.`

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
      <p>${escapeHtml(msg).replace(/\n/g, '<br/>')}</p>
      <style>
        body {
          padding: 1em 2em;
        }
      </style>
    </body>
  `
}
