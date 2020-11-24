import { Plugin } from 'rollup'

export interface OptimizeAnalysisResult {
  isCommonjs: { [name: string]: true }
}

export function entryAnalysisPlugin(): Plugin {
  const analysis: OptimizeAnalysisResult = { isCommonjs: {} }
  return {
    name: 'vite:cjs-entry-named-export',
    async generateBundle(options, bundles) {
      Object.values(bundles).forEach((bundle) => {
        if (bundle.type === 'chunk' && bundle.isEntry) {
          if (bundle.facadeModuleId) {
            const facadeInfo = this.getModuleInfo(bundle.facadeModuleId)
            // this info is exposed by rollup commonjs plugin
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
