import path from 'node:path'
import { NULL_BYTE_PLACEHOLDER } from '../../shared/constants'
import {
  cleanUrl,
  joinUrlSegments,
  splitFileAndPostfix,
} from '../../shared/utils'
import { FS_PREFIX } from '../constants'
import { isDirectRequest } from '../plugins/css'
import type { IndexHtmlTransformContext } from '../plugins/html'
import { checkPublicFile } from '../publicDir'
import type { ViteDevServer } from '../server'
import {
  decodeURIIfPossible,
  injectQuery,
  isCSSRequest,
  isDataUrl,
  isExternalUrl,
  isImportRequest,
  isInternalRequest,
  normalizePath,
  removeImportQuery,
  removeTimestampQuery,
  safeRealpathSync,
  stripBase,
  urlRE,
} from '../utils'
import { resolveStaticPathname } from './middlewares/static'
import { isTransformRequest } from './middlewares/transform'
import { browserUrlToModuleUrl, moduleUrlToFilePath } from './moduleUrl'

export function htmlUrlToRequestUrl(
  url: string,
  ctx: Pick<IndexHtmlTransformContext, 'path' | 'originalUrl' | 'server'>,
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

export async function addHtmlRequestToSafeModulePaths(
  requestUrl: string,
  server: ViteDevServer,
  fetchDest?: string,
): Promise<void> {
  const { config } = server
  const decodedUrl = decodeURIIfPossible(removeTimestampQuery(requestUrl))
  if (decodedUrl === undefined) return
  const pathname = cleanUrl(decodedUrl)
  if (
    !isInternalRequest(requestUrl) &&
    !isImportRequest(requestUrl) &&
    !urlRE.test(requestUrl) &&
    checkPublicFile(pathname, config)
  ) {
    return
  }

  if (isTransformRequest(decodedUrl, fetchDest)) {
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
  const { postfix } = splitFileAndPostfix(decodedUrl)
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
