import path from 'node:path'
import type { DefaultTreeAdapterMap } from 'parse5'
import { NULL_BYTE_PLACEHOLDER, VALID_ID_PREFIX } from '../../shared/constants'
import {
  cleanUrl,
  joinUrlSegments,
  splitFileAndPostfix,
} from '../../shared/utils'
import { getNodeAssetAttributes } from '../assetSource'
import { FS_PREFIX } from '../constants'
import { isDirectRequest } from '../plugins/css'
import {
  type IndexHtmlTransformContext,
  extractImportExpressionFromClassicScript,
  getScriptInfo,
  nodeIsElement,
  traverseHtml,
} from '../plugins/html'
import { checkPublicFile } from '../publicDir'
import {
  decodeURIIfPossible,
  injectQuery,
  isCSSRequest,
  isDataUrl,
  isExternalUrl,
  isImportRequest,
  isInternalRequest,
  normalizePath,
  processSrcSetSync,
  removeImportQuery,
  removeTimestampQuery,
  safeRealpathSync,
  stripBase,
  urlRE,
} from '../utils'
import { resolveStaticPathname } from './middlewares/static'
import { isTransformRequest } from './middlewares/transform'
import { browserUrlToModuleUrl, moduleUrlToFilePath } from './moduleUrl'

function htmlUrlToRequestUrl(
  url: string,
  ctx: IndexHtmlTransformContext,
): string | undefined {
  url = url.split('#', 1)[0]
  if (!url || isExternalUrl(url) || isDataUrl(url)) return

  const { config } = ctx.server!
  let resolvedUrl: URL
  try {
    // ctx.path has already passed through the base and HTML fallback middleware.
    const documentUrl = new URL(
      ctx.originalUrl ?? joinUrlSegments(config.base, ctx.path),
      'http://example.com',
    )
    resolvedUrl = new URL(url, documentUrl)
  } catch {
    return
  }
  if (resolvedUrl.origin !== 'http://example.com') return

  // The browser resolves the URL before the base middleware sees the request.
  return stripBase(resolvedUrl.pathname + resolvedUrl.search, config.base)
}

export function getHtmlAssetFetchDest(
  tag: string,
  attr: string,
  attributes: Record<string, string>,
): string | undefined {
  if (attr === 'src' && ['iframe', 'frame', 'fencedframe'].includes(tag)) {
    return tag
  }
  if (tag !== 'link' || attr !== 'href') return

  const rel = attributes.rel?.trim().toLowerCase().split(/\s+/)
  if (rel?.includes('modulepreload')) return 'script'
  if (rel?.includes('stylesheet')) return 'style'
  if (rel?.includes('preload')) return attributes.as?.trim().toLowerCase()
}

export async function addHtmlUrlToSafeModulePaths(
  url: string,
  ctx: IndexHtmlTransformContext,
  fetchDest?: string,
): Promise<void> {
  const server = ctx.server
  if (!server) return

  const { config } = server
  const requestUrl = htmlUrlToRequestUrl(url, ctx)
  if (!requestUrl) return
  const pathname = decodeURIIfPossible(cleanUrl(requestUrl))
  if (pathname === undefined) return
  if (
    isInternalRequest(pathname) &&
    !pathname.startsWith(FS_PREFIX) &&
    !pathname.startsWith(VALID_ID_PREFIX)
  ) {
    return
  }
  if (
    !isInternalRequest(requestUrl) &&
    !isImportRequest(requestUrl) &&
    !urlRE.test(requestUrl) &&
    checkPublicFile(pathname, config)
  ) {
    return
  }

  const decodedUrl = decodeURIIfPossible(removeTimestampQuery(requestUrl))
  if (decodedUrl !== undefined && isTransformRequest(decodedUrl, fetchDest)) {
    let moduleUrl = browserUrlToModuleUrl(
      removeImportQuery(decodedUrl.replace(NULL_BYTE_PLACEHOLDER, '\0')),
      '',
    )
    if (
      fetchDest === 'style' &&
      isCSSRequest(moduleUrl) &&
      !isDirectRequest(moduleUrl)
    ) {
      moduleUrl = injectQuery(moduleUrl, 'direct')
    }
    const resolved =
      await server.environments.client.pluginContainer.resolveId(moduleUrl)
    if (resolved) {
      if (!resolved.external) config.safeModulePaths.addId(resolved.id)
      return
    }
  }

  if (isInternalRequest(pathname) && !pathname.startsWith(FS_PREFIX)) return

  const filePath = pathname.startsWith(FS_PREFIX)
    ? moduleUrlToFilePath(pathname, config.root)
    : normalizePath(
        path.join(
          config.root,
          resolveStaticPathname(pathname, config) || pathname,
        ),
      )
  const { postfix } = splitFileAndPostfix(decodedUrl ?? requestUrl)
  config.safeModulePaths.addId(filePath + postfix)
  if (!config.resolve.preserveSymlinks) {
    try {
      config.safeModulePaths.addId(
        normalizePath(safeRealpathSync(filePath)) + postfix,
      )
    } catch {
      // Files referenced by HTML may not exist yet.
    }
  }
}

export async function addHtmlToSafeModulePaths(
  html: string,
  ctx: IndexHtmlTransformContext,
): Promise<void> {
  const urls = new Set<string>()
  const registrations: Promise<void>[] = []
  const registerUrl = (url: string, fetchDest?: string) => {
    const key = `${fetchDest ?? ''}:${url}`
    if (urls.has(key)) return
    urls.add(key)
    registrations.push(addHtmlUrlToSafeModulePaths(url, ctx, fetchDest))
  }
  await traverseHtml(
    html,
    ctx.filename,
    () => {},
    (node) => {
      if (!nodeIsElement(node)) return

      if (node.nodeName === 'script') {
        const { src, isModule, isIgnored } = getScriptInfo(node)
        if (!isIgnored) {
          if (src) {
            registerUrl(src.value, 'script')
          } else if (!isModule && node.childNodes.length) {
            const scriptNode = node.childNodes.at(
              -1,
            ) as DefaultTreeAdapterMap['textNode']
            for (const { url } of extractImportExpressionFromClassicScript(
              scriptNode,
            )) {
              registerUrl(url, 'script')
            }
          }
        }
      }

      for (const attr of getNodeAssetAttributes(
        node,
        ctx.server!.config.html?.additionalAssetSources,
      )) {
        if (attr.type === 'srcset') {
          processSrcSetSync(attr.value, ({ url }) => {
            registerUrl(url)
            return url
          })
        } else if (attr.type === 'src') {
          registerUrl(
            attr.value,
            getHtmlAssetFetchDest(node.nodeName, attr.key, attr.attributes),
          )
        }
      }
    },
  )
  await Promise.all(registrations)
}
