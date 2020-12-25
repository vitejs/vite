import { Plugin } from 'rollup'
import { DepOptimizationMetadata } from '.'

export function recordCjsEntryPlugin(data: DepOptimizationMetadata): Plugin {
  return {
    name: 'vite:cjs-entry-named-export',
    async generateBundle(options, bundle) {
      Object.values(bundle).forEach((chunk) => {
        if (chunk.type === 'chunk' && chunk.isEntry) {
          data.map[chunk.name] = chunk.fileName
          if (chunk.facadeModuleId) {
            const facadeInfo = this.getModuleInfo(chunk.facadeModuleId)
            // this info is exposed by rollup commonjs plugin
            if (facadeInfo?.meta?.commonjs?.isCommonJS) {
              data.cjsEntries[chunk.fileName] = true
            }
          }
        }
      })
    }
  }
}
