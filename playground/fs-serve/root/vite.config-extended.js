import path from 'node:path'
import { defineConfig, mergeConfig, normalizePath } from 'vite'
import config from './vite.config.js'

const virtualModuleIds = new Set(
  ['virtual.js', 'virtual.svg', 'denied.js', 'denied.svg'].map((file) =>
    normalizePath(path.resolve(import.meta.dirname, file)),
  ),
)

export default defineConfig(
  mergeConfig(config, {
    build: {
      outDir: 'dist/extended',
    },
    server: {
      fs: {
        strict: 'extended',
        allow: ['virtual.js', 'virtual.svg'],
      },
    },
    plugins: [
      {
        name: 'path-based-virtual-modules',
        enforce: 'pre',
        resolveId(id) {
          const resolvedId = normalizePath(
            path.resolve(import.meta.dirname, `.${id}`),
          )
          if (virtualModuleIds.has(resolvedId)) return resolvedId
        },
        load(id) {
          if (virtualModuleIds.has(id)) {
            return `export default '<svg><rect width="100" height="100"></svg>'`
          }
        },
      },
    ],
  }),
)
