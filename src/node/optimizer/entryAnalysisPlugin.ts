import { Plugin } from 'rollup'

export function entryAnalysisPlugin(): Plugin {
  const analysis: { isCommonjs: { [name: string]: true } } = { isCommonjs: {} }
  return {
    name: 'vite:cjs-entry-named-export',
    async generateBundle(options, bundles) {
      Object.values(bundles).forEach((bundle) => {
        if (bundle.type === 'chunk' && bundle.isEntry) {
          if (bundle.facadeModuleId) {
            const facadeInfo = this.getModuleInfo(bundle.facadeModuleId)
            if (facadeInfo?.meta?.commonjs?.isCommonJS) {
              analysis.isCommonjs[bundle.name] = true
            }
          }
        }
      })
      this.emitFile({
        type: 'asset',
        fileName: '_analysis.json',
        source: JSON.stringify(analysis)
      })
    }
  }
}
