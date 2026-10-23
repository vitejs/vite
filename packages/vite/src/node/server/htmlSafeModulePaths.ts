import path from 'node:path'
import type { DefaultTreeAdapterMap } from 'parse5'
import { VALID_ID_PREFIX } from '../../shared/constants'
import { splitFileAndPostfix, unwrapId } from '../../shared/utils'
import { getNodeAssetAttributes } from '../assetSource'
import { FS_PREFIX } from '../constants'
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
  fsPathFromId,
  isDataUrl,
  isExternalUrl,
  isInternalRequest,
  normalizePath,
  processSrcSetSync,
  removeImportQuery,
  removeTimestampQuery,
  safeRealpathSync,
  stripBase,
} from '../utils'
import { applyStaticAlias } from './middlewares/static'

export function addHtmlUrlToSafeModulePaths(
  url: string,
  ctx: IndexHtmlTransformContext,
): string | undefined {
  const server = ctx.server
  if (!server) return

  const { config } = server
  const withoutBase = stripBase(url, config.base)
  url = withoutBase === url ? stripBase(url, config.decodedBase) : withoutBase
  url = url.split('#', 1)[0]
  if (
    !url ||
    isExternalUrl(url) ||
    isDataUrl(url) ||
    checkPublicFile(url, config)
  ) {
    return
  }
  const { file, postfix } = splitFileAndPostfix(url)
  let resolvedUrl: URL
  try {
    resolvedUrl = new URL(file, `http://example.com${ctx.path}`)
  } catch {
    return
  }
  if (resolvedUrl.origin !== 'http://example.com') return
  const decodedFile = decodeURIIfPossible(resolvedUrl.pathname)
  if (decodedFile === undefined) return
  const moduleUrl = decodeURIIfPossible(resolvedUrl.pathname + postfix)
  if (isInternalRequest(decodedFile) && !decodedFile.startsWith(FS_PREFIX)) {
    if (decodedFile.startsWith(VALID_ID_PREFIX) && moduleUrl !== undefined) {
      return unwrapId(moduleUrl)
    }
    return
  }

  const aliasedFile = applyStaticAlias(decodedFile, config.resolve.alias)
  const filePath = normalizePath(
    aliasedFile ||
      (decodedFile.startsWith(FS_PREFIX)
        ? fsPathFromId(decodedFile)
        : path.join(config.root, decodedFile)),
  )
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
  return moduleUrl
}

export async function addHtmlToSafeModulePaths(
  html: string,
  ctx: IndexHtmlTransformContext,
): Promise<void> {
  const moduleUrls = new Set<string>()
  const registerUrl = (url: string) => {
    const moduleUrl = addHtmlUrlToSafeModulePaths(url, ctx)
    if (moduleUrl) {
      moduleUrls.add(removeImportQuery(removeTimestampQuery(moduleUrl)))
    }
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
            registerUrl(src.value)
          } else if (!isModule && node.childNodes.length) {
            const scriptNode = node.childNodes.at(
              -1,
            ) as DefaultTreeAdapterMap['textNode']
            for (const { url } of extractImportExpressionFromClassicScript(
              scriptNode,
            )) {
              registerUrl(url)
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
          registerUrl(attr.value)
        }
      }
    },
  )
  await Promise.all(
    [...moduleUrls].map(async (url) => {
      const resolved =
        await ctx.server!.environments.client.pluginContainer.resolveId(url)
      if (resolved && !resolved.external) {
        ctx.server!.config.safeModulePaths.addId(resolved.id)
      }
    }),
  )
}
