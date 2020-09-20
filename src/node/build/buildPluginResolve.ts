import { Plugin } from 'rollup'
import fs from 'fs-extra'
import path from 'path'
import { resolveVue } from '../utils/resolveVue'
import { InternalResolver } from '../resolver'
import { isExternalUrl } from '../utils'

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
      if (isExternalUrl(id)) {
        return { id, external: true }
      }
      if (id.startsWith('/') && !id.startsWith(root)) {
        const resolved = resolver.requestToFile(id)
        if (fs.existsSync(resolved)) {
          debug(id, `-->`, resolved)
          return resolved
        }
      }
      // fallback to node-resolve because alias
      if (id !== original) {
        const resolve = (id: string) =>
          this.resolve(id, importer, { skipSelf: true })

        const resolved =
          (await resolve(id)) ||
          // aliased import might be provided by root
          (await resolve(path.join(root, 'node_modules', id)))

        return resolved || { id }
      }
    }
  }
}
