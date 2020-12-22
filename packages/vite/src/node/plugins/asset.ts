import chalk from 'chalk'
import path from 'path'
import { parse as parseUrl } from 'url'
import fs, { promises as fsp } from 'fs'
import mime from 'mime/lite'
import { Plugin } from '../plugin'
import { ResolvedConfig } from '../config'
import { createDebugger, cleanUrl } from '../utils'
import { FS_PREFIX } from '../constants'
import { PluginContext } from 'rollup'
import MagicString from 'magic-string'

const debug = createDebugger('vite:asset')

export const assetUrlRE = /"__VITE_ASSET__(\w+)(?:__(.*)__)?"/g

export function isPublicFile(url: string, root: string): string | undefined {
  // note if the file is in /public, the resolver would have returned it
  // as-is so it's not going to be a fully resolved path.
  if (!url.startsWith('/')) {
    return
  }
  const publicFile = path.posix.join(root, 'public', cleanUrl(url))
  if (fs.existsSync(publicFile)) {
    return publicFile
  } else {
    return
  }
}

/**
 * Also supports loading plain strings with import text from './foo.txt?raw'
 */
export function assetPlugin(config: ResolvedConfig): Plugin {
  const publicIdMap = new Map<string, string>()

  return {
    name: 'vite:asset',

    resolveId(id) {
      // imports to absolute urls pointing to files in /public
      // will fail to resolve in the main resolver. handle them here.
      const publicFile = isPublicFile(id, config.root)
      if (publicFile) {
        publicIdMap.set(id, publicFile)
        return id
      }
    },

    async load(id) {
      let file = cleanUrl(id)
      if (!config.assetsInclude(file)) {
        return
      }

      const publicFile = publicIdMap.get(id)
      if (publicFile) {
        file = publicFile
      }

      if (/(\?|&)raw\b/.test(id)) {
        debug(`[raw] ${chalk.dim(file)}`)
        // raw query, read file and return as string
        return `export default ${JSON.stringify(
          await fsp.readFile(file, 'utf-8')
        )}`
      }

      debug(`[import] ${chalk.dim(file)}`)

      // serve
      if (config.command === 'serve') {
        let publicPath
        if (publicFile) {
          // in public dir, keep the url as-is
          publicPath = id
        } else if (id.startsWith(config.root)) {
          // in project root, infer short public path
          publicPath = '/' + path.posix.relative(config.root, id)
        } else {
          // outside of project root, use absolute fs path
          // (this is speical handled by the serve static middleware
          publicPath = FS_PREFIX + id
        }
        return `export default ${JSON.stringify(publicPath)}`
      }

      // build
      if (publicFile) {
        // in public dir, will be copied over to the same url, but need to
        // account for base config
        return `export default ${JSON.stringify(
          config.build.base + id.slice(1)
        )}`
      } else {
        return `export default ${await registerBuildAssetFromFile(
          id,
          config,
          this
        )}`
      }
    },

    renderChunk(code) {
      let match
      let s
      while ((match = assetUrlRE.exec(code))) {
        s = s || (s = new MagicString(code))
        const [full, fileHandle, postfix = ''] = match
        const outputFilepath =
          config.build.base + this.getFileName(fileHandle) + postfix
        s.overwrite(
          match.index,
          match.index + full.length,
          JSON.stringify(outputFilepath)
        )
      }
      if (s) {
        return {
          code: s.toString(),
          map: config.build.sourcemap ? s.generateMap({ hires: true }) : null
        }
      } else {
        return null
      }
    }
  }
}

export async function registerBuildAsset(
  url: string,
  importer: string,
  config: ResolvedConfig,
  pluginContext: PluginContext
): Promise<string> {
  if (isPublicFile(url, config.root)) {
    return config.build.base + url.slice(1)
  }
  const file = url.startsWith('/')
    ? path.join(config.root, url)
    : path.join(path.dirname(importer), url)
  return registerBuildAssetFromFile(file, config, pluginContext)
}

const assetCache = new WeakMap<ResolvedConfig, Map<string, string>>()

/**
 * Register an asset to be emitted as part of the bundle (if necessary)
 * and returns the resolved public URL
 */
async function registerBuildAssetFromFile(
  id: string,
  config: ResolvedConfig,
  pluginContext: PluginContext
): Promise<string> {
  let cache = assetCache.get(config)
  if (!cache) {
    cache = new Map()
    assetCache.set(config, cache)
  }
  const cached = cache.get(id)
  if (cached) {
    return cached
  }

  const file = cleanUrl(id)
  const { search, hash } = parseUrl(id)
  const postfix = (search || '') + (hash || '')
  // TODO preserve fragment hash or queries
  const content = await fsp.readFile(file)

  let url
  if (
    !file.endsWith('.svg') &&
    content.length < Number(config.build.assetsInlineLimit)
  ) {
    // base64 inlined as a string
    url = JSON.stringify(
      `data:${mime.getType(file)};base64,${content.toString('base64')}`
    )
  } else {
    // emit as asset
    // rollup supports `import.meta.ROLLUP_FILE_URL_*`, but it generates code
    // that uses runtime url sniffing and it can be verbose when targeting
    // non-module format. For consistency, generate a marker here and replace
    // with resolved url strings in renderChunk.
    const fileId = pluginContext.emitFile({
      name: path.basename(file),
      type: 'asset',
      source: content
    })
    url = JSON.stringify(
      `__VITE_ASSET__${fileId}${postfix ? `__${postfix}__` : ``}`
    )
  }

  cache.set(id, url)
  return url
}
