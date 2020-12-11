import chalk from 'chalk'
import fs, { promises as fsp } from 'fs'
import qs from 'querystring'
import { Plugin, ResolvedConfig } from '..'
import { createDebugger, cleanUrl } from '../utils'
import { FILE_PREFIX } from './resolve'

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
export function assetPlugin(config: ResolvedConfig, isBuild: boolean): Plugin {
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

      if (!isBuild) {
        if (fs.existsSync(file)) {
          if (isRawRequest) {
            debug(`[raw] ${chalk.dim(file)}`)
            // raw query, read file and return as string
            return `export default ${JSON.stringify(
              await fsp.readFile(file, 'utf-8')
            )}`
          } else {
            debug(`[import] ${chalk.dim(file)}`)
            // return the location of the file. during dev, this will be
            // the /@fs/ prefixed path as a string.
            return `export default ${JSON.stringify(FILE_PREFIX + id)}`
          }
        }
      }

      // TODO build asset resolution
    }
  }
}
