import fs from 'node:fs'
import path from 'node:path'
import MagicString from 'magic-string'
import type { SourceMapInput } from 'rollup'
import type { Connect } from 'dep-types/connect'
import type { DefaultTreeAdapterMap, Token } from 'parse5'
import type { IndexHtmlTransformHook } from '../../plugins/html'
import {
  addToHTMLProxyCache,
  applyHtmlTransforms,
  assetAttrsConfig,
  getAttrKey,
  getScriptInfo,
  htmlEnvHook,
  nodeIsElement,
  overwriteAttrValue,
  postImportMapHook,
  preImportMapHook,
  resolveHtmlTransforms,
  traverseHtml,
} from '../../plugins/html'
import type { ResolvedConfig, ViteDevServer } from '../..'
import { send } from '../send'
import { CLIENT_PUBLIC_PATH, FS_PREFIX } from '../../constants'
import {
  cleanUrl,
  ensureWatchedFile,
  fsPathFromId,
  injectQuery,
  joinUrlSegments,
  normalizePath,
  processSrcSetSync,
  wrapId,
} from '../../utils'
import type { ModuleGraph } from '../moduleGraph'

interface AssetNode {
  start: number
  end: number
  code: string
}

export function createDevHtmlTransformFn(
  server: ViteDevServer,
): (url: string, html: string, originalUrl: string) => Promise<string> {
  const [preHooks, normalHooks, postHooks] = resolveHtmlTransforms(
    server.config.plugins,
  )
  return (url: string, html: string, originalUrl: string): Promise<string> => {
    return applyHtmlTransforms(
      html,
      [
        preImportMapHook(server.config),
        ...preHooks,
        htmlEnvHook(server.config),
        devHtmlHook,
        ...normalHooks,
        ...postHooks,
        postImportMapHook(),
      ],
      {
        path: url,
        filename: getHtmlFilename(url, server),
        server,
        originalUrl,
      },
    )
  }
}

function getHtmlFilename(url: string, server: ViteDevServer) {
  if (url.startsWith(FS_PREFIX)) {
    return decodeURIComponent(fsPathFromId(url))
  } else {
    return decodeURIComponent(
      normalizePath(path.join(server.config.root, url.slice(1))),
    )
  }
}

const startsWithSingleSlashRE = /^\/(?!\/)/
const processNodeUrl = (
  attr: Token.Attribute,
  sourceCodeLocation: Token.Location,
  s: MagicString,
  config: ResolvedConfig,
  htmlPath: string,
  originalUrl?: string,
  moduleGraph?: ModuleGraph,
) => {
  let url = attr.value || ''

  if (moduleGraph) {
    const mod = moduleGraph.urlToModuleMap.get(url)
    if (mod && mod.lastHMRTimestamp > 0) {
      url = injectQuery(url, `t=${mod.lastHMRTimestamp}`)
    }
  }
  const devBase = config.base
  if (startsWithSingleSlashRE.test(url)) {
    // prefix with base (dev only, base is never relative)
    const fullUrl = path.posix.join(devBase, url)
    overwriteAttrValue(s, sourceCodeLocation, fullUrl)
  } else if (
    url.startsWith('.') &&
    originalUrl &&
    originalUrl !== '/' &&
    htmlPath === '/index.html'
  ) {
    // prefix with base (dev only, base is never relative)
    const replacer = (url: string) => path.posix.join(devBase, url)

    // #3230 if some request url (localhost:3000/a/b) return to fallback html, the relative assets
    // path will add `/a/` prefix, it will caused 404.
    // rewrite before `./index.js` -> `localhost:5173/a/index.js`.
    // rewrite after `../index.js` -> `localhost:5173/index.js`.

    const processedUrl =
      attr.name === 'srcset' && attr.prefix === undefined
        ? processSrcSetSync(url, ({ url }) => replacer(url))
        : replacer(url)
    overwriteAttrValue(s, sourceCodeLocation, processedUrl)
  }
}
const devHtmlHook: IndexHtmlTransformHook = async (
  html,
  { path: htmlPath, filename, server, originalUrl },
) => {
  const { config, moduleGraph, watcher } = server!
  const base = config.base || '/'

  let proxyModulePath: string
  let proxyModuleUrl: string

  const trailingSlash = htmlPath.endsWith('/')
  if (!trailingSlash && fs.existsSync(filename)) {
    proxyModulePath = htmlPath
    proxyModuleUrl = joinUrlSegments(base, htmlPath)
  } else {
    // There are users of vite.transformIndexHtml calling it with url '/'
    // for SSR integrations #7993, filename is root for this case
    // A user may also use a valid name for a virtual html file
    // Mark the path as virtual in both cases so sourcemaps aren't processed
    // and ids are properly handled
    const validPath = `${htmlPath}${trailingSlash ? 'index.html' : ''}`
    proxyModulePath = `\0${validPath}`
    proxyModuleUrl = wrapId(proxyModulePath)
  }

  const s = new MagicString(html)
  let inlineModuleIndex = -1
  const proxyCacheUrl = cleanUrl(proxyModulePath).replace(
    normalizePath(config.root),
    '',
  )
  const styleUrl: AssetNode[] = []

  const addInlineModule = (
    node: DefaultTreeAdapterMap['element'],
    ext: 'js',
  ) => {
    inlineModuleIndex++

    const contentNode = node.childNodes[0] as DefaultTreeAdapterMap['textNode']

    const code = contentNode.value

    let map: SourceMapInput | undefined
    if (!proxyModulePath.startsWith('\0')) {
      map = new MagicString(html)
        .snip(
          contentNode.sourceCodeLocation!.startOffset,
          contentNode.sourceCodeLocation!.endOffset,
        )
        .generateMap({ hires: true })
      map.sources = [filename]
      map.file = filename
    }

    // add HTML Proxy to Map
    addToHTMLProxyCache(config, proxyCacheUrl, inlineModuleIndex, { code, map })

    // inline js module. convert to src="proxy" (dev only, base is never relative)
    const modulePath = `${proxyModuleUrl}?html-proxy&index=${inlineModuleIndex}.${ext}`

    // invalidate the module so the newly cached contents will be served
    const module = server?.moduleGraph.getModuleById(modulePath)
    if (module) {
      server?.moduleGraph.invalidateModule(module)
    }
    s.update(
      node.sourceCodeLocation!.startOffset,
      node.sourceCodeLocation!.endOffset,
      `<script type="module" src="${modulePath}"></script>`,
    )
  }

  await traverseHtml(html, filename, (node) => {
    if (!nodeIsElement(node)) {
      return
    }

    // script tags
    if (node.nodeName === 'script') {
      const { src, sourceCodeLocation, isModule } = getScriptInfo(node)

      if (src) {
        processNodeUrl(
          src,
          sourceCodeLocation!,
          s,
          config,
          htmlPath,
          originalUrl,
          moduleGraph,
        )
      } else if (isModule && node.childNodes.length) {
        addInlineModule(node, 'js')
      }
    }

    if (node.nodeName === 'style' && node.childNodes.length) {
      const children = node.childNodes[0] as DefaultTreeAdapterMap['textNode']
      styleUrl.push({
        start: children.sourceCodeLocation!.startOffset,
        end: children.sourceCodeLocation!.endOffset,
        code: children.value,
      })
    }

    // elements with [href/src] attrs
    const assetAttrs = assetAttrsConfig[node.nodeName]
    if (assetAttrs) {
      for (const p of node.attrs) {
        const attrKey = getAttrKey(p)
        if (p.value && assetAttrs.includes(attrKey)) {
          processNodeUrl(
            p,
            node.sourceCodeLocation!.attrs![attrKey],
            s,
            config,
            htmlPath,
            originalUrl,
          )
        }
      }
    }
  })

  await Promise.all(
    styleUrl.map(async ({ start, end, code }, index) => {
      const url = `${proxyModulePath}?html-proxy&direct&index=${index}.css`

      // ensure module in graph after successful load
      const mod = await moduleGraph.ensureEntryFromUrl(url, false)
      ensureWatchedFile(watcher, mod.file, config.root)

      const result = await server!.pluginContainer.transform(code, mod.id!)
      s.overwrite(start, end, result?.code || '')
    }),
  )

  html = s.toString()

  return {
    html,
    tags: [
      {
        tag: 'script',
        attrs: {
          type: 'module',
          src: path.posix.join(base, CLIENT_PUBLIC_PATH),
        },
        injectTo: 'head-prepend',
      },
    ],
  }
}

export function indexHtmlMiddleware(
  server: ViteDevServer,
): Connect.NextHandleFunction {
  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return async function viteIndexHtmlMiddleware(req, res, next) {
    if (res.writableEnded) {
      return next()
    }

    const url = req.url && cleanUrl(req.url)
    // htmlFallbackMiddleware appends '.html' to URLs
    if (url?.endsWith('.html') && req.headers['sec-fetch-dest'] !== 'script') {
      const filename = getHtmlFilename(url, server)
      if (fs.existsSync(filename)) {
        try {
          let html = fs.readFileSync(filename, 'utf-8')
          html = await server.transformIndexHtml(url, html, req.originalUrl)
          return send(req, res, html, 'html', {
            headers: server.config.server.headers,
          })
        } catch (e) {
          return next(e)
        }
      }
    }
    next()
  }
}
