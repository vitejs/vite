import { cleanUrl } from './../utils'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import { isJSRequest } from '../utils'
import { checkPublicFile } from './asset'
import { isCSSRequest } from './css'
import { promises as fs } from 'fs'
import path from 'path'

// just run in serve
export function publicLoaderPlugin(config: ResolvedConfig): Plugin {
  const needLoad = (id: string) =>
    checkPublicFile(id, config) && (isCSSRequest(id) || isJSRequest(id))

  return {
    name: 'vite:server-public-hmr-loader',

    resolveId(id) {
      if (needLoad(id)) {
        return path.join(config.publicDir, id)
      }
    },

    async load(id) {
      if (needLoad(id)) {
        const url = cleanUrl(id)
        const code = await fs.readFile(
          path.join(config.publicDir, url),
          'utf-8'
        )
        return code
      }
      return null
    }
  }
}
