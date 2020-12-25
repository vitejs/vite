import { Plugin } from 'rollup'

export function recordCjsEntryPlugin(data: Record<string, true>): Plugin {
  return {
    name: 'vite:cjs-entry-named-export',
    async generateBundle(options, bundle) {
      Object.values(bundle).forEach((chunk) => {
        if (chunk.type === 'chunk' && chunk.isEntry) {
          if (chunk.facadeModuleId) {
            const facadeInfo = this.getModuleInfo(chunk.facadeModuleId)
            // this info is exposed by rollup commonjs plugin
            if (facadeInfo?.meta?.commonjs?.isCommonJS) {
              data[chunk.facadeModuleId] = true
            }
          }
        }
      })
    }
  }
}
