import { promises as fs } from 'fs'
import { Plugin } from '..'
import { cleanUrl } from '../utils'

export function loadFallbackPlugin(): Plugin {
  return {
    name: 'load-fallback',
    async load(id) {
      try {
        return fs.readFile(cleanUrl(id), 'utf-8')
      } catch (e) {
        return fs.readFile(id, 'utf-8')
      }
    }
  }
}
