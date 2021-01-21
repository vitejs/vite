import { Plugin } from 'rollup'
import { DepOptimizationMetadata } from '.'

const moduleIdRE = /node_modules\/([^@.][^/]*|@[^/]+\/[^/]+)\//

export function recordCjsEntryPlugin(data: DepOptimizationMetadata): Plugin {
  return {
    name: 'vite:cjs-entry-named-export',
    async generateBundle(_, bundle) {
      Object.values(bundle).forEach((chunk) => {
        if (chunk.type === 'chunk') {
          if (chunk.isEntry) {
            data.optimized[chunk.name] = chunk.fileName
            if (chunk.facadeModuleId) {
              const facadeInfo = this.getModuleInfo(chunk.facadeModuleId)
              // this info is exposed by rollup commonjs plugin
              if (facadeInfo?.meta?.commonjs?.isCommonJS) {
                data.cjsEntries[chunk.fileName] = true
              }
            }
          }
          for (const id in chunk.modules) {
            const depId = id.match(moduleIdRE)?.[1]
            if (depId) {
              data.transitiveOptimized[depId] = true
            }
          }
        }
      })

      for (const key in data.transitiveOptimized) {
        if (key in data.optimized) {
          delete data.transitiveOptimized[key]
        }
      }
    }
  }
}
