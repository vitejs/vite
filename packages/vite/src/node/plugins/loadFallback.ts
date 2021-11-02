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
      try {
        // if we don't add `await` here, we couldn't catch the error in readFile
        return await fs.readFile(cleanUrl(id), 'utf-8')
      } catch (e) {
        return fs.readFile(id, 'utf-8')
      }
    }
  }
}
