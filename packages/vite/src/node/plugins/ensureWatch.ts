import type { Plugin } from '../plugin'
import { cleanUrl } from '../utils'

/**
 * plugin to ensure rollup can watch correctly.
 */
export function ensureWatchPlugin(): Plugin {
  return {
    name: 'vite:ensure-watch',
    load(id) {
      if (id.includes('?')) {
        this.addWatchFile(cleanUrl(id))
      }
      return null
    }
  }
}
