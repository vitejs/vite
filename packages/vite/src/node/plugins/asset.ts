import path from 'node:path'
import { parse as parseUrl } from 'node:url'
import fs, { promises as fsp } from 'node:fs'
import { Buffer } from 'node:buffer'
import * as mrmime from 'mrmime'
import type {
  NormalizedOutputOptions,
  PluginContext,
  RenderedChunk,
} from 'rollup'
import MagicString from 'magic-string'
import colors from 'picocolors'
import {
  createToImportMetaURLBasedRelativeRuntime,
  toOutputFilePathInJS,
} from '../build'
import type { Plugin } from '../plugin'
import type { ResolvedConfig } from '../config'
import { cleanUrl, getHash, joinUrlSegments, normalizePath } from '../utils'
import { FS_PREFIX } from '../constants'

export const assetUrlRE = /__VITE_ASSET__([a-z\d]+)__(?:\$_(.*?)__)?/g

const rawRE = /(?:\?|&)raw(?:&|$)/
const urlRE = /(\?|&)url(?:&|$)/
const jsSourceMapRE = /\.[cm]?js\.map$/

const assetCache = new WeakMap<ResolvedConfig, Map<string, string>>()

// chunk.name is the basename for the asset ignoring the directory structure
// For the manifest, we need to preserve the original file path and isEntry
// for CSS assets. We keep a map from referenceId to this information.
export interface GeneratedAssetMeta {
  originalName: string
  isEntry?: boolean
}
export const generatedAssets = new WeakMap<
  ResolvedConfig,
  Map<string, GeneratedAssetMeta>
>()

// add own dictionary entry by directly assigning mrmime
export function registerCustomMime(): void {
  // https://github.com/lukeed/mrmime/issues/3
  mrmime.mimes['ico'] = 'image/x-icon'
  // https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Containers#flac
  mrmime.mimes['flac'] = 'audio/flac'
  // mrmime and mime-db is not released yet: https://github.com/jshttp/mime-db/commit/c9242a9b7d4bb25d7a0c9244adec74aeef08d8a1
  mrmime.mimes['aac'] = 'audio/aac'
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
  mrmime.mimes['eot'] = 'application/vnd.ms-fontobject'
}

export function renderAssetUrlInJS(
  ctx: PluginContext,
  config: ResolvedConfig,
  chunk: RenderedChunk,
  opts: NormalizedOutputOptions,
  code: string,
): MagicString | undefined {
  const toRelativeRuntime = createToImportMetaURLBasedRelativeRuntime(
    opts.format,
  )

  let match: RegExpExecArray | null
  let s: MagicString | undefined

  // Urls added with JS using e.g.
  // imgElement.src = "__VITE_ASSET__5aa0ddc0__" are using quotes

  // Urls added in CSS that is imported in JS end up like
  // var inlined = ".inlined{color:green;background:url(__VITE_ASSET__5aa0ddc0__)}\n";

  // In both cases, the wrapping should already be fine

  assetUrlRE.lastIndex = 0
  while ((match = assetUrlRE.exec(code))) {
    s ||= new MagicString(code)
    const [full, referenceId, postfix = ''] = match
    const file = ctx.getFileName(referenceId)
    chunk.viteMetadata.importedAssets.add(cleanUrl(file))
    const filename = file + postfix
    const replacement = toOutputFilePathInJS(
      filename,
      'asset',
      chunk.fileName,
      'js',
      config,
      toRelativeRuntime,
    )
    const replacementString =
      typeof replacement === 'string'
        ? JSON.stringify(replacement).slice(1, -1)
        : `"+${replacement.runtime}+"`
    s.update(match.index, match.index + full.length, replacementString)
  }

  // Replace __VITE_PUBLIC_ASSET__5aa0ddc0__ with absolute paths

  const publicAssetUrlMap = publicAssetUrlCache.get(config)!
  publicAssetUrlRE.lastIndex = 0
  while ((match = publicAssetUrlRE.exec(code))) {
    s ||= new MagicString(code)
    const [full, hash] = match
    const publicUrl = publicAssetUrlMap.get(hash)!.slice(1)
    const replacement = toOutputFilePathInJS(
      publicUrl,
      'public',
      chunk.fileName,
      'js',
      config,
      toRelativeRuntime,
    )
    const replacementString =
      typeof replacement === 'string'
        ? JSON.stringify(replacement).slice(1, -1)
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

    buildStart() {
      assetCache.set(config, new Map())
      generatedAssets.set(config, new Map())
    },

    resolveId(id) {
      if (!config.assetsInclude(cleanUrl(id))) {
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
      if (id.startsWith('\0')) {
        // Rollup convention, this id should be handled by the
        // plugin that marked it with \0
        return
      }

      // raw requests, read from disk
      if (rawRE.test(id)) {
        const file = checkPublicFile(id, config) || cleanUrl(id)
        // raw query, read file and return as string
        return `export default ${JSON.stringify(
          await fsp.readFile(file, 'utf-8'),
        )}`
      }

      if (!config.assetsInclude(cleanUrl(id)) && !urlRE.test(id)) {
        return
      }

      id = id.replace(urlRE, '$1').replace(/[?&]$/, '')
      const url = await fileToUrl(id, config, this)
      return `export default ${JSON.stringify(url)}`
    },

    renderChunk(code, chunk, opts) {
      const s = renderAssetUrlInJS(this, config, chunk, opts, code)

      if (s) {
        return {
          code: s.toString(),
          map: config.build.sourcemap ? s.generateMap({ hires: true }) : null,
        }
      } else {
        return null
      }
    },

    generateBundle(_, bundle) {
      // do not emit assets for SSR build
      if (
        config.command === 'build' &&
        config.build.ssr &&
        !config.build.ssrEmitAssets
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

export function checkPublicFile(
  url: string,
  { publicDir }: ResolvedConfig,
): string | undefined {
  // note if the file is in /public, the resolver would have returned it
  // as-is so it's not going to be a fully resolved path.
  if (!publicDir || !url.startsWith('/')) {
    return
  }
  const publicFile = path.join(publicDir, cleanUrl(url))
  if (!publicFile.startsWith(publicDir)) {
    // can happen if URL starts with '../'
    return
  }
  if (fs.existsSync(publicFile)) {
    return publicFile
  } else {
    return
  }
}

export async function fileToUrl(
  id: string,
  config: ResolvedConfig,
  ctx: PluginContext,
): Promise<string> {
  if (config.command === 'serve') {
    return fileToDevUrl(id, config)
  } else {
    return fileToBuiltUrl(id, config, ctx)
  }
}

function fileToDevUrl(id: string, config: ResolvedConfig) {
  let rtn: string
  if (checkPublicFile(id, config)) {
    // in public dir, keep the url as-is
    rtn = id
  } else if (id.startsWith(config.root)) {
    // in project root, infer short public path
    rtn = '/' + path.posix.relative(config.root, id)
  } else {
    // outside of project root, use absolute fs path
    // (this is special handled by the serve static middleware
    rtn = path.posix.join(FS_PREFIX, id)
  }
  const base = joinUrlSegments(config.server?.origin ?? '', config.base)
  return joinUrlSegments(base, rtn.replace(/^\//, ''))
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
    return joinUrlSegments(config.base, url)
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
  id: string,
  config: ResolvedConfig,
  pluginContext: PluginContext,
  skipPublicCheck = false,
): Promise<string> {
  if (!skipPublicCheck && checkPublicFile(id, config)) {
    return publicFileToBuiltUrl(id, config)
  }

  const cache = assetCache.get(config)!
  const cached = cache.get(id)
  if (cached) {
    return cached
  }

  const file = cleanUrl(id)
  const content = await fsp.readFile(file)

  let url: string
  if (
    config.build.lib ||
    (!file.endsWith('.svg') &&
      !file.endsWith('.html') &&
      content.length < Number(config.build.assetsInlineLimit) &&
      !isGitLfsPlaceholder(content))
  ) {
    if (config.build.lib && isGitLfsPlaceholder(content)) {
      config.logger.warn(
        colors.yellow(`Inlined file ${id} was not downloaded via Git LFS`),
      )
    }

    const mimeType = mrmime.lookup(file) ?? 'application/octet-stream'
    // base64 inlined as a string
    url = `data:${mimeType};base64,${content.toString('base64')}`
  } else {
    // emit as asset
    const { search, hash } = parseUrl(id)
    const postfix = (search || '') + (hash || '')

    const referenceId = pluginContext.emitFile({
      // Ignore directory structure for asset file names
      name: path.basename(file),
      type: 'asset',
      source: content,
    })

    const originalName = normalizePath(path.relative(config.root, file))
    generatedAssets.get(config)!.set(referenceId, { originalName })

    url = `__VITE_ASSET__${referenceId}__${postfix ? `$_${postfix}__` : ``}` // TODO_BASE
  }

  cache.set(id, url)
  return url
}

export async function urlToBuiltUrl(
  url: string,
  importer: string,
  config: ResolvedConfig,
  pluginContext: PluginContext,
): Promise<string> {
  if (checkPublicFile(url, config)) {
    return publicFileToBuiltUrl(url, config)
  }
  const file = url.startsWith('/')
    ? path.join(config.root, url)
    : path.join(path.dirname(importer), url)
  return fileToBuiltUrl(
    file,
    config,
    pluginContext,
    // skip public check since we just did it above
    true,
  )
}
