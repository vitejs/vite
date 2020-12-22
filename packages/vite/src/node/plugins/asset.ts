import chalk from 'chalk'
import path from 'path'
import fs, { promises as fsp } from 'fs'
import mime from 'mime/lite'
import { Plugin } from '../plugin'
import { ResolvedConfig } from '../config'
import { createDebugger, cleanUrl } from '../utils'
import { FS_PREFIX } from '../constants'
import slash from 'slash'
import { PluginContext } from 'rollup'
import MagicString from 'magic-string'

const debug = createDebugger('vite:asset')

export const assetUrlRE = /__VITE_ASSET__(\w+)/g

export function isPublicFile(file: string, root: string): string | undefined {
  // note if the file is in /public, the resolver would have returned it
  // as-is so it's not going to be a fully resolved path.
  const publicFile = path.posix.join(root, 'public', file)
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
      const publicFile = isPublicFile(cleanUrl(id), config.root)
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
      } else if (publicFile) {
        // public request, return as-is
        return `export default ${JSON.stringify(id)}`
      } else {
        debug(`[import] ${chalk.dim(file)}`)
        if (config.command === 'serve') {
          // return the url of the file relative to served root.
          const publicPath = id.startsWith(config.root)
            ? // in project root, infer short public path
              `/${slash(path.relative(config.root, id))}`
            : // outside of project root, use absolute fs path
              // (this is speical handled by the serve static middleware
              `${FS_PREFIX}${slash(id)}`
          return `export default ${JSON.stringify(publicPath)}`
        } else {
          return `export default ${await registerBuildAsset(
            file,
            config,
            this
          )}`
        }
      }
    },

    renderChunk(code) {
      let match
      let s
      while ((match = assetUrlRE.exec(code))) {
        s = s || (s = new MagicString(code))
        const fileHandle = match[1]
        const outputFilepath = config.build.base + this.getFileName(fileHandle)
        s.overwrite(
          match.index,
          match.index + match[0].length,
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

/**
 * Register an asset to be emitted as part of the bundle (if necessary)
 * and returns the resolved public URL
 */
export async function registerBuildAsset(
  file: string,
  config: ResolvedConfig,
  pluginContext: PluginContext
): Promise<string> {
  const content = await fsp.readFile(file)
  if (
    !file.endsWith('.svg') &&
    content.length < Number(config.build.assetsInlineLimit)
  ) {
    // base64 inlined as a string
    return JSON.stringify(
      `data:${mime.getType(file)};base64,${content.toString('base64')}`
    )
  } else {
    // emit as asset
    // rollup supports `import.meta.ROLLUP_FILE_URL_*`, but it generates code
    // that uses runtime url sniffing and it can be verbose when targeting
    // non-module format. For consistency, let's generate
    const fileId = pluginContext.emitFile({
      name: path.basename(file),
      type: 'asset',
      source: content
    })
    return `__VITE_ASSET__${fileId}`
  }
}
