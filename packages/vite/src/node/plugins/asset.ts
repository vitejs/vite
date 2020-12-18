import chalk from 'chalk'
import path from 'path'
import fs, { promises as fsp } from 'fs'
import { Plugin } from '../plugin'
import { ResolvedConfig } from '../config'
import { createDebugger, cleanUrl } from '../utils'
import { FILE_PREFIX } from '../constants'
import slash from 'slash'

const debug = createDebugger('vite:asset')

export const injectAssetRE = /import.meta.ROLLUP_FILE_URL_(\w+)/

/**
 * Also supports loading plain strings with import text from './foo.txt?raw'
 */
export function assetPlugin(config: ResolvedConfig): Plugin {
  return {
    name: 'vite:asset',
    async load(id) {
      const file = cleanUrl(id)
      if (!config.assetsInclude(file) || !fs.existsSync(file)) {
        return
      }

      if (/(\?|&)raw\b/.test(id)) {
        debug(`[raw] ${chalk.dim(file)}`)
        // raw query, read file and return as string
        return `export default ${JSON.stringify(
          await fsp.readFile(file, 'utf-8')
        )}`
      } else {
        debug(`[import] ${chalk.dim(file)}`)
        if (config.command === 'serve') {
          // return the url of the file relative to served root.
          const publicPath = id.startsWith(config.root)
            ? // in project root, infer short public path
              `/${slash(path.relative(config.root, id))}`
            : // outside of project root, use absolute fs path
              // (this is speical handled by the serve static middleware
              `${FILE_PREFIX}${slash(id)}`
          return `export default ${JSON.stringify(publicPath)}`
        } else {
          // TODO: build has different asset resolution rules
          return 'export default "todo"'
        }
      }
    }
  }
}
