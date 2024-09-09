import path from 'node:path'
import { parse as parseUrl } from 'node:url'
import fsp from 'node:fs/promises'
import { Buffer } from 'node:buffer'
import * as mrmime from 'mrmime'
import type { NormalizedOutputOptions, RenderedChunk } from 'rollup'
import MagicString from 'magic-string'
import colors from 'picocolors'
import {
  createToImportMetaURLBasedRelativeRuntime,
  toOutputFilePathInJS,
} from '../build'
import type { Plugin, PluginContext } from '../plugin'
import type { ResolvedConfig } from '../config'
import { checkPublicFile } from '../publicDir'
import {
  encodeURIPath,
  getHash,
  injectQuery,
  joinUrlSegments,
  normalizePath,
  rawRE,
  removeLeadingSlash,
  removeUrlQuery,
  urlRE,
} from '../utils'
import { DEFAULT_ASSETS_INLINE_LIMIT, FS_PREFIX } from '../constants'
import { cleanUrl, withTrailingSlash } from '../../shared/utils'
import type { Environment } from '../environment'

// referenceId is base64url but replaces - with $
export const assetUrlRE = /__VITE_ASSET__([\w$]+)__(?:\$_(.*?)__)?/g

const jsSourceMapRE = /\.[cm]?js\.map$/

const assetCache = new WeakMap<Environment, Map<string, string>>()

// chunk.name is the basename for the asset ignoring the directory structure
// For the manifest, we need to preserve the original file path and isEntry
// for CSS assets. We keep a map from referenceId to this information.
export interface GeneratedAssetMeta {
  originalFileName: string
  isEntry?: boolean
}
export const generatedAssetsMap = new WeakMap<
  Environment,
  Map<string, GeneratedAssetMeta>
>()

// add own dictionary entry by directly assigning mrmime
export function registerCustomMime(): void {
  // https://github.com/lukeed/mrmime/issues/3
  mrmime.mimes['ico'] = 'image/x-icon'
  // https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Containers#flac
  mrmime.mimes['flac'] = 'audio/flac'
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
  mrmime.mimes['eot'] = 'application/vnd.ms-fontobject'
}

export function renderAssetUrlInJS(
  pluginContext: PluginContext,
  chunk: RenderedChunk,
  opts: NormalizedOutputOptions,
  code: string,
): MagicString | undefined {
  const { environment } = pluginContext
  const toRelativeRuntime = createToImportMetaURLBasedRelativeRuntime(
    opts.format,
    environment.config.isWorker,
  )

  let match: RegExpExecArray | null
  let s: MagicString | undefined

  // Urls added with JS using e.g.
  // imgElement.src = "__VITE_ASSET__5aA0Ddc0__" are using quotes

  // Urls added in CSS that is imported in JS end up like
  // var inlined = ".inlined{color:green;background:url(__VITE_ASSET__5aA0Ddc0__)}\n";

  // In both cases, the wrapping should already be fine

  assetUrlRE.lastIndex = 0
  while ((match = assetUrlRE.exec(code))) {
    s ||= new MagicString(code)
    const [full, referenceId, postfix = ''] = match
    const file = pluginContext.getFileName(referenceId)
    chunk.viteMetadata!.importedAssets.add(cleanUrl(file))
    const filename = file + postfix
    const replacement = toOutputFilePathInJS(
      environment,
      filename,
      'asset',
      chunk.fileName,
      'js',
      toRelativeRuntime,
    )
    const replacementString =
      typeof replacement === 'string'
        ? JSON.stringify(encodeURIPath(replacement)).slice(1, -1)
        : `"+${replacement.runtime}+"`
    s.update(match.index, match.index + full.length, replacementString)
  }

  // Replace __VITE_PUBLIC_ASSET__5aA0Ddc0__ with absolute paths

  const publicAssetUrlMap = publicAssetUrlCache.get(
    environment.getTopLevelConfig(),
  )!
  publicAssetUrlRE.lastIndex = 0
  while ((match = publicAssetUrlRE.exec(code))) {
    s ||= new MagicString(code)
    const [full, hash] = match
    const publicUrl = publicAssetUrlMap.get(hash)!.slice(1)
    const replacement = toOutputFilePathInJS(
      environment,
      publicUrl,
      'public',
      chunk.fileName,
      'js',
      toRelativeRuntime,
    )
    const replacementString =
      typeof replacement === 'string'
        ? JSON.stringify(encodeURIPath(replacement)).slice(1, -1)
        : `"+${replacement.runtime}+"`
    s.update(match.index, match.index + full.length, replacementString)
  }

  return s
}

/**
 * Also supports loading plain strings with import text from './foo.txt?raw'
 */
export function assetPlugin(config: ResolvedConfig): Plugin {
  registerCustomMime()

  return {
    name: 'vite:asset',

    perEnvironmentStartEndDuringDev: true,

    buildStart() {
      assetCache.set(this.environment, new Map())
      generatedAssetsMap.set(this.environment, new Map())
    },

    resolveId(id) {
      if (!config.assetsInclude(cleanUrl(id)) && !urlRE.test(id)) {
        return
      }
      // imports to absolute urls pointing to files in /public
      // will fail to resolve in the main resolver. handle them here.
      const publicFile = checkPublicFile(id, config)
      if (publicFile) {
        return id
      }
    },

    async load(id) {
      if (id[0] === '\0') {
        // Rollup convention, this id should be handled by the
        // plugin that marked it with \0
        return
      }

      // raw requests, read from disk
      if (rawRE.test(id)) {
        const file = checkPublicFile(id, config) || cleanUrl(id)
        this.addWatchFile(file)
        // raw query, read file and return as string
        return `export default ${JSON.stringify(
          await fsp.readFile(file, 'utf-8'),
        )}`
      }

      if (!urlRE.test(id) && !config.assetsInclude(cleanUrl(id))) {
        return
      }

      id = removeUrlQuery(id)
      let url = await fileToUrl(this, id)

      // Inherit HMR timestamp if this asset was invalidated
      const environment = this.environment
      const mod =
        environment.mode === 'dev' && environment.moduleGraph.getModuleById(id)
      if (mod && mod.lastHMRTimestamp > 0) {
        url = injectQuery(url, `t=${mod.lastHMRTimestamp}`)
      }

      return {
        code: `export default ${JSON.stringify(encodeURIPath(url))}`,
        // Force rollup to keep this module from being shared between other entry points if it's an entrypoint.
        // If the resulting chunk is empty, it will be removed in generateBundle.
        moduleSideEffects:
          config.command === 'build' && this.getModuleInfo(id)?.isEntry
            ? 'no-treeshake'
            : false,
        meta: config.command === 'build' ? { 'vite:asset': true } : undefined,
      }
    },

    renderChunk(code, chunk, opts) {
      const s = renderAssetUrlInJS(this, chunk, opts, code)

      if (s) {
        return {
          code: s.toString(),
          map: this.environment.config.build.sourcemap
            ? s.generateMap({ hires: 'boundary' })
            : null,
        }
      } else {
        return null
      }
    },

    generateBundle(_, bundle) {
      // Remove empty entry point file
      for (const file in bundle) {
        const chunk = bundle[file]
        if (
          chunk.type === 'chunk' &&
          chunk.isEntry &&
          chunk.moduleIds.length === 1 &&
          config.assetsInclude(chunk.moduleIds[0]) &&
          this.getModuleInfo(chunk.moduleIds[0])?.meta['vite:asset']
        ) {
          delete bundle[file]
        }
      }

      // do not emit assets for SSR build
      if (
        config.command === 'build' &&
        !this.environment.config.build.emitAssets
      ) {
        for (const file in bundle) {
          if (
            bundle[file].type === 'asset' &&
            !file.endsWith('ssr-manifest.json') &&
            !jsSourceMapRE.test(file)
          ) {
            delete bundle[file]
          }
        }
      }
    },
  }
}

export async function fileToUrl(
  pluginContext: PluginContext,
  id: string,
): Promise<string> {
  const { environment } = pluginContext
  if (environment.config.command === 'serve') {
    return fileToDevUrl(id, environment.getTopLevelConfig())
  } else {
    return fileToBuiltUrl(pluginContext, id)
  }
}

export function fileToDevUrl(
  id: string,
  config: ResolvedConfig,
  skipBase = false,
): string {
  let rtn: string
  if (checkPublicFile(id, config)) {
    // in public dir during dev, keep the url as-is
    rtn = id
  } else if (id.startsWith(withTrailingSlash(config.root))) {
    // in project root, infer short public path
    rtn = '/' + path.posix.relative(config.root, id)
  } else {
    // outside of project root, use absolute fs path
    // (this is special handled by the serve static middleware
    rtn = path.posix.join(FS_PREFIX, id)
  }
  if (skipBase) {
    return rtn
  }
  const base = joinUrlSegments(config.server?.origin ?? '', config.decodedBase)
  return joinUrlSegments(base, removeLeadingSlash(rtn))
}

export function getPublicAssetFilename(
  hash: string,
  config: ResolvedConfig,
): string | undefined {
  return publicAssetUrlCache.get(config)?.get(hash)
}

export const publicAssetUrlCache = new WeakMap<
  ResolvedConfig,
  // hash -> url
  Map<string, string>
>()

export const publicAssetUrlRE = /__VITE_PUBLIC_ASSET__([a-z\d]{8})__/g

export function publicFileToBuiltUrl(
  url: string,
  config: ResolvedConfig,
): string {
  if (config.command !== 'build') {
    // We don't need relative base or renderBuiltUrl support during dev
    return joinUrlSegments(config.decodedBase, url)
  }
  const hash = getHash(url)
  let cache = publicAssetUrlCache.get(config)
  if (!cache) {
    cache = new Map<string, string>()
    publicAssetUrlCache.set(config, cache)
  }
  if (!cache.get(hash)) {
    cache.set(hash, url)
  }
  return `__VITE_PUBLIC_ASSET__${hash}__`
}

const GIT_LFS_PREFIX = Buffer.from('version https://git-lfs.github.com')
function isGitLfsPlaceholder(content: Buffer): boolean {
  if (content.length < GIT_LFS_PREFIX.length) return false
  // Check whether the content begins with the characteristic string of Git LFS placeholders
  return GIT_LFS_PREFIX.compare(content, 0, GIT_LFS_PREFIX.length) === 0
}

/**
 * Register an asset to be emitted as part of the bundle (if necessary)
 * and returns the resolved public URL
 */
async function fileToBuiltUrl(
  pluginContext: PluginContext,
  id: string,
  skipPublicCheck = false,
  forceInline?: boolean,
): Promise<string> {
  const environment = pluginContext.environment
  const topLevelConfig = environment.getTopLevelConfig()
  if (!skipPublicCheck && checkPublicFile(id, topLevelConfig)) {
    return publicFileToBuiltUrl(id, topLevelConfig)
  }

  const cache = assetCache.get(environment)!
  const cached = cache.get(id)
  if (cached) {
    return cached
  }

  const file = cleanUrl(id)
  const content = await fsp.readFile(file)

  let url: string
  if (shouldInline(pluginContext, file, id, content, forceInline)) {
    if (environment.config.build.lib && isGitLfsPlaceholder(content)) {
      environment.logger.warn(
        colors.yellow(`Inlined file ${id} was not downloaded via Git LFS`),
      )
    }

    if (file.endsWith('.svg')) {
      url = svgToDataURL(content)
    } else {
      const mimeType = mrmime.lookup(file) ?? 'application/octet-stream'
      // base64 inlined as a string
      url = `data:${mimeType};base64,${content.toString('base64')}`
    }
  } else {
    // emit as asset
    const { search, hash } = parseUrl(id)
    const postfix = (search || '') + (hash || '')

    const originalFileName = normalizePath(
      path.relative(environment.config.root, file),
    )
    const referenceId = pluginContext.emitFile({
      type: 'asset',
      // Ignore directory structure for asset file names
      name: path.basename(file),
      originalFileName,
      source: content,
    })
    generatedAssetsMap.get(environment)!.set(referenceId, { originalFileName })

    url = `__VITE_ASSET__${referenceId}__${postfix ? `$_${postfix}__` : ``}`
  }

  cache.set(id, url)
  return url
}

export async function urlToBuiltUrl(
  pluginContext: PluginContext,
  url: string,
  importer: string,
  forceInline?: boolean,
): Promise<string> {
  const topLevelConfig = pluginContext.environment.getTopLevelConfig()
  if (checkPublicFile(url, topLevelConfig)) {
    return publicFileToBuiltUrl(url, topLevelConfig)
  }
  const file =
    url[0] === '/'
      ? path.join(topLevelConfig.root, url)
      : path.join(path.dirname(importer), url)
  return fileToBuiltUrl(
    pluginContext,
    file,
    // skip public check since we just did it above
    true,
    forceInline,
  )
}

const shouldInline = (
  pluginContext: PluginContext,
  file: string,
  id: string,
  content: Buffer,
  forceInline: boolean | undefined,
): boolean => {
  const environment = pluginContext.environment
  const { assetsInlineLimit } = environment.config.build
  if (environment.config.build.lib) return true
  if (pluginContext.getModuleInfo(id)?.isEntry) return false
  if (forceInline !== undefined) return forceInline
  let limit: number
  if (typeof assetsInlineLimit === 'function') {
    const userShouldInline = assetsInlineLimit(file, content)
    if (userShouldInline != null) return userShouldInline
    limit = DEFAULT_ASSETS_INLINE_LIMIT
  } else {
    limit = Number(assetsInlineLimit)
  }
  if (file.endsWith('.html')) return false
  // Don't inline SVG with fragments, as they are meant to be reused
  if (file.endsWith('.svg') && id.includes('#')) return false
  return content.length < limit && !isGitLfsPlaceholder(content)
}

const nestedQuotesRE = /"[^"']*'[^"]*"|'[^'"]*"[^']*'/

// Inspired by https://github.com/iconify/iconify/blob/main/packages/utils/src/svg/url.ts
function svgToDataURL(content: Buffer): string {
  const stringContent = content.toString()
  // If the SVG contains some text or HTML, any transformation is unsafe, and given that double quotes would then
  // need to be escaped, the gain to use a data URI would be ridiculous if not negative
  if (
    stringContent.includes('<text') ||
    stringContent.includes('<foreignObject') ||
    nestedQuotesRE.test(stringContent)
  ) {
    return `data:image/svg+xml;base64,${content.toString('base64')}`
  } else {
    return (
      'data:image/svg+xml,' +
      stringContent
        .trim()
        .replaceAll(/>\s+</g, '><')
        .replaceAll('"', "'")
        .replaceAll('%', '%25')
        .replaceAll('#', '%23')
        .replaceAll('<', '%3c')
        .replaceAll('>', '%3e')
        // Spaces are not valid in srcset it has some use cases
        // it can make the uncompressed URI slightly higher than base64, but will compress way better
        // https://github.com/vitejs/vite/pull/14643#issuecomment-1766288673
        .replaceAll(/\s+/g, '%20')
    )
  }
}
