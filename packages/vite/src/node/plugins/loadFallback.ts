import { promises as fs } from 'fs'
import { Plugin } from '..'
import { cleanUrl } from '../utils'

/**
 * A plugin to provide build load fallback for arbitrary request with queries.
 */
export function loadFallbackPlugin(): Plugin {
  return {
    name: 'vite:load-fallback',
    async load(id) {
      let filename: string
      let code: string
      try {
        code = await fs.readFile((filename = cleanUrl(id)), 'utf-8')
      } catch (e) {
        // Try unclean `id` to handle rare case where the file path
        // contains the # character.
        code = await fs.readFile((filename = id), 'utf-8')
      }
      return { code, meta: { filename } }
    }
  }
}
