import path from 'node:path'
import { splitFileAndPostfix } from '../../shared/utils'
import { FS_PREFIX } from '../constants'
import type {
  HtmlTagDescriptor,
  IndexHtmlTransformContext,
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
  stripBase,
} from '../utils'

export function addHtmlUrlToSafeModulePaths(
  url: string,
  ctx: IndexHtmlTransformContext,
): void {
  const server = ctx.server
  if (!server) return

  const { config } = server
  url = stripBase(url, config.base)
  url = stripBase(url, config.decodedBase)
  if (
    !url ||
    url[0] === '#' ||
    isExternalUrl(url) ||
    isDataUrl(url) ||
    isInternalRequest(url) ||
    checkPublicFile(url, config)
  ) {
    return
  }

  const { file, postfix } = splitFileAndPostfix(url)
  let resolvedUrl: URL
  try {
    resolvedUrl = new URL(file, `http://vite.local${ctx.path}`)
  } catch {
    return
  }
  if (resolvedUrl.origin !== 'http://vite.local') return
  const decodedFile = decodeURIIfPossible(resolvedUrl.pathname)
  if (decodedFile === undefined) return

  const filePath = normalizePath(
    decodedFile.startsWith(FS_PREFIX)
      ? fsPathFromId(decodedFile)
      : path.join(config.root, decodedFile),
  )
  config.safeModulePaths.addId(filePath + postfix)
}

export function addHtmlSrcSetToSafeModulePaths(
  srcset: string,
  ctx: IndexHtmlTransformContext,
): void {
  processSrcSetSync(srcset, ({ url }) => {
    addHtmlUrlToSafeModulePaths(url, ctx)
    return url
  })
}

export function addHtmlTagDescriptorToSafeModulePaths(
  tag: HtmlTagDescriptor,
  ctx: IndexHtmlTransformContext,
): void {
  if (tag.attrs) {
    if (tag.tag === 'script' && typeof tag.attrs.src === 'string') {
      addHtmlUrlToSafeModulePaths(tag.attrs.src, ctx)
    } else if (tag.tag === 'link') {
      if (typeof tag.attrs.href === 'string') {
        addHtmlUrlToSafeModulePaths(tag.attrs.href, ctx)
      }
      if (typeof tag.attrs.imagesrcset === 'string') {
        addHtmlSrcSetToSafeModulePaths(tag.attrs.imagesrcset, ctx)
      }
    }
  }
  if (Array.isArray(tag.children)) {
    for (const child of tag.children) {
      addHtmlTagDescriptorToSafeModulePaths(child, ctx)
    }
  }
}
