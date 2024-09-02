import fsp from 'node:fs/promises'
import { cleanUrl } from '../../shared/utils'
import type { Plugin } from '../plugin'

/**
 * A plugin to provide build load fallback for arbitrary request with queries.
 */
export function buildLoadFallbackPlugin(): Plugin {
  return {
    name: 'vite:load-fallback',
    async load(id) {
      try {
        const cleanedId = cleanUrl(id)
        const content = await fsp.readFile(cleanedId, 'utf-8')
        this.addWatchFile(cleanedId)
        return content
      } catch (e) {
        const content = await fsp.readFile(id, 'utf-8')
        this.addWatchFile(id)
        return content
      }
    },
  }
}
