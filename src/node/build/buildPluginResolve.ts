import { Plugin } from 'rollup'
import fs from 'fs-extra'
import { hmrClientId } from '../server/serverPluginHmr'
import { InternalResolver } from '../resolver'
import { resolveVue } from '../utils/resolveVue'
import { resolveWebModule } from '../server/serverPluginModuleResolve'

const debug = require('debug')('vite:build:resolve')

export const createBuildResolvePlugin = (
  root: string,
  resolver: InternalResolver
): Plugin => {
  return {
    name: 'vite:resolve',
    async resolveId(id: string) {
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
        const webModulePath = await resolveWebModule(root, id)
        if (webModulePath) {
          return webModulePath
        }
      }
      // fallback to node-resolve
    },
    load(id: string) {
      if (id === hmrClientId) {
        return `export const hot = {accept(){},dispose(){},on(){}}`
      }
    }
  }
}
