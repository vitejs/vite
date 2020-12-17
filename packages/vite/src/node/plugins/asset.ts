import chalk from 'chalk'
import path from 'path'
import fs, { promises as fsp } from 'fs'
import qs from 'querystring'
import { Plugin } from '../plugin'
import { ResolvedConfig } from '../config'
import { createDebugger, cleanUrl } from '../utils'
import { FILE_PREFIX } from '../constants'
import slash from 'slash'

const debug = createDebugger('vite:asset')

const assetsRE = new RegExp(
  `\\.(` +
    // images
    `png|jpe?g|gif|svg|ico|webp|` +
    // media
    `mp4|webm|ogg|mp3|wav|flac|aac|` +
    // fonts
    `woff2?|eot|ttf|otf` +
    `)(\\?.*)?$`
)

/**
 * Also supports loading plain strings with import text from './foo.txt?raw'
 */
export function assetPlugin(config: ResolvedConfig): Plugin {
  return {
    name: 'vite:asset',
    async load(id) {
      const query = id.match(/\?(.*)$/)?.[1]
      const isRawRequest = query && qs.parse(query).raw != null
      const file = cleanUrl(id)
      if (
        !isRawRequest &&
        !assetsRE.test(file) &&
        !config.assetsInclude?.(file)
      ) {
        return
      }

      if (config.command === 'serve') {
        if (fs.existsSync(file)) {
          if (isRawRequest) {
            debug(`[raw] ${chalk.dim(file)}`)
            // raw query, read file and return as string
            return `export default ${JSON.stringify(
              await fsp.readFile(file, 'utf-8')
            )}`
          } else {
            debug(`[import] ${chalk.dim(file)}`)
            // return the url of the file relative to served root.
            const publicPath = id.startsWith(config.root)
              ? // in project root, infer short public path
                `/${slash(path.relative(config.root, id))}`
              : // outside of project root, use absolute fs path
                // (this is speical handled by the serve static middleware
                `${FILE_PREFIX}${slash(id)}`
            return `export default ${JSON.stringify(publicPath)}`
          }
        }
      }

      // TODO build asset resolution
    }
  }
}
