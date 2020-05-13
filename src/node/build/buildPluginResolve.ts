import { Plugin } from 'rollup'
import fs from 'fs-extra'
import { hmrClientId } from '../server/serverPluginHmr'
import { resolveVue } from '../utils/resolveVue'
import { InternalResolver, resolveOptimizedModule } from '../resolver'

const debug = require('debug')('vite:build:resolve')

export const createBuildResolvePlugin = (
  root: string,
  resolver: InternalResolver
): Plugin => {
  return {
    name: 'vite:resolve',
    async resolveId(id, importer) {
      id = resolver.alias(id) || id
      if (id === hmrClientId) {
        return hmrClientId
      }
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
      } else if (!id.startsWith('.')) {
        const optimizedModule = resolveOptimizedModule(root, id)
        if (optimizedModule) {
          return optimizedModule
        }
      }
      // fallback to node-resolve
      const resolved = this.resolve(id, importer, { skipSelf: true })
      return resolved || { id }
    },
    load(id: string) {
      if (id === hmrClientId) {
        return `export const hot = {accept(){},dispose(){},on(){}}`
      }
    }
  }
}
