import path from 'node:path'
import type { Plugin } from 'vite'

const playgroundRoot = path.dirname(import.meta.dirname).replace(/\\/g, '/')
const targetRoot = playgroundRoot.replace(/^[A-Z]:/i, '')
const target = path.posix.join(targetRoot, 'root/unsafe.txt')
const decoyId = path.posix.join(import.meta.dirname.replace(/\\/g, '/'), target)

export default function safeModulePathPlugin(): Plugin {
  return {
    name: 'safe-module-path',
    enforce: 'pre',
    resolveId(id) {
      if (id === 'virtual:safe-module-path-confusion') {
        return decoyId
      }
    },
    load(id) {
      if (id === decoyId) {
        return 'export {}'
      }
    },
  }
}
