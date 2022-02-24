import { cleanUrl } from './../utils'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import { isJSRequest } from '../utils'
import { checkPublicFile } from './asset'
import { isCSSRequest } from './css'
import { promises as fs } from 'fs'
import path from 'path'

export function publicLoaderPlugin(config: ResolvedConfig): Plugin {
  const isServe = config.command === 'serve'

  return {
    name: 'vite:server-public-hmr-loader',

    async load(id) {
      if (isServe) {
        if (
          checkPublicFile(id, config) &&
          (isCSSRequest(id) || isJSRequest(id))
        ) {
          const url = cleanUrl(id)
          const code = await fs.readFile(
            path.join(config.publicDir, url),
            'utf-8'
          )
          return code
        }
      }
      return null
    }
  }
}
