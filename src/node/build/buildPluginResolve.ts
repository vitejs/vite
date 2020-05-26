import { Plugin } from 'rollup'
import fs from 'fs-extra'
import { resolveVue } from '../utils/resolveVue'
import { InternalResolver } from '../resolver'

const debug = require('debug')('vite:build:resolve')

export const createBuildResolvePlugin = (
  root: string,
  resolver: InternalResolver
): Plugin => {
  return {
    name: 'vite:resolve',
    async resolveId(id, importer) {
      const original = id
      id = resolver.alias(id) || id
      if (id === 'vue' || id.startsWith('@vue/')) {
        const vuePaths = resolveVue(root)
        if (id in vuePaths) {
          return (vuePaths as any)[id]
        }
      }
      if (id.startsWith('/')) {
        const resolved = resolver.requestToFile(id)
        if (fs.existsSync(resolved)) {
          debug(id, `-->`, resolved)
          return resolved
        }
      }
      // fallback to node-resolve because alias
      if (id !== original) {
        const resolved = this.resolve(id, importer, { skipSelf: true })
        return resolved || { id }
      }
    }
  }
}
