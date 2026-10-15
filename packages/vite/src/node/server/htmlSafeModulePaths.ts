import path from 'node:path'
import type { DefaultTreeAdapterMap } from 'parse5'
import { splitFileAndPostfix } from '../../shared/utils'
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
  safeRealpathSync,
  stripBase,
} from '../utils'
import { applyStaticAlias } from './middlewares/static'

export function addHtmlUrlToSafeModulePaths(
  url: string,
  ctx: IndexHtmlTransformContext,
): void {
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
    (isInternalRequest(url) && !url.startsWith(FS_PREFIX)) ||
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
}

function addHtmlSrcSetToSafeModulePaths(
  srcset: string,
  ctx: IndexHtmlTransformContext,
): void {
  processSrcSetSync(srcset, ({ url }) => {
    addHtmlUrlToSafeModulePaths(url, ctx)
    return url
  })
}

export async function addHtmlToSafeModulePaths(
  html: string,
  ctx: IndexHtmlTransformContext,
): Promise<void> {
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
            addHtmlUrlToSafeModulePaths(src.value, ctx)
          } else if (!isModule && node.childNodes.length) {
            const scriptNode = node.childNodes.at(
              -1,
            ) as DefaultTreeAdapterMap['textNode']
            for (const { url } of extractImportExpressionFromClassicScript(
              scriptNode,
            )) {
              addHtmlUrlToSafeModulePaths(url, ctx)
            }
          }
        }
      }

      for (const attr of getNodeAssetAttributes(
        node,
        ctx.server!.config.html?.additionalAssetSources,
      )) {
        if (attr.type === 'srcset') {
          addHtmlSrcSetToSafeModulePaths(attr.value, ctx)
        } else if (attr.type === 'src') {
          addHtmlUrlToSafeModulePaths(attr.value, ctx)
        }
      }
    },
  )
}
