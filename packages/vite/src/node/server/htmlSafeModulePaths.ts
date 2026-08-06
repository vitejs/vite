import path from 'node:path'
import type {
  HtmlTagDescriptor,
  IndexHtmlTransformContext,
} from '../plugins/html'
import { checkPublicFile } from '../publicDir'
import {
  isDataUrl,
  isExternalUrl,
  isInternalRequest,
  processSrcSetSync,
  stripBase,
} from '../utils'
import { cleanUrl } from '../../shared/utils'

export async function addHtmlUrlToSafeModulePaths(
  url: string,
  ctx: IndexHtmlTransformContext,
): Promise<void> {
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

  try {
    const importer = ctx.path.endsWith('/')
      ? path.join(ctx.filename, 'index.html')
      : ctx.filename
    const resolved = await server.environments.client.pluginContainer.resolveId(
      url,
      importer,
    )
    if (
      resolved &&
      resolved.id[0] !== '\0' &&
      path.isAbsolute(cleanUrl(resolved.id))
    ) {
      config.safeModulePaths.addUrl(resolved.id)
    }
  } catch {
    // Keep unresolved HTML references for the browser to handle.
  }
}

export function addHtmlSrcSetToSafeModulePaths(
  srcset: string,
  ctx: IndexHtmlTransformContext,
): Promise<void[]> {
  const promises: Promise<void>[] = []
  processSrcSetSync(srcset, ({ url }) => {
    promises.push(addHtmlUrlToSafeModulePaths(url, ctx))
    return url
  })
  return Promise.all(promises)
}

export async function addHtmlTagDescriptorToSafeModulePaths(
  tag: HtmlTagDescriptor,
  ctx: IndexHtmlTransformContext,
): Promise<void> {
  const promises: Promise<unknown>[] = []
  if (tag.attrs) {
    if (tag.tag === 'script' && typeof tag.attrs.src === 'string') {
      promises.push(addHtmlUrlToSafeModulePaths(tag.attrs.src, ctx))
    } else if (tag.tag === 'link') {
      if (typeof tag.attrs.href === 'string') {
        promises.push(addHtmlUrlToSafeModulePaths(tag.attrs.href, ctx))
      }
      if (typeof tag.attrs.imagesrcset === 'string') {
        promises.push(
          addHtmlSrcSetToSafeModulePaths(tag.attrs.imagesrcset, ctx),
        )
      }
    }
  }
  if (Array.isArray(tag.children)) {
    promises.push(
      ...tag.children.map((child) =>
        addHtmlTagDescriptorToSafeModulePaths(child, ctx),
      ),
    )
  }
  await Promise.all(promises)
}
