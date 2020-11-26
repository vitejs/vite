import path from 'path'
import slash from 'slash'
import { Plugin } from 'rollup'
import { resolveOptimizedCacheDir } from './index'

export interface OptimizeAnalysisResult {
  isCommonjs: { [name: string]: true }
}

export function entryAnalysisPlugin({ root }: { root: string }): Plugin {
  const analysis: OptimizeAnalysisResult = { isCommonjs: {} }
  const cacheDir = resolveOptimizedCacheDir(root)!
  return {
    name: 'vite:cjs-entry-named-export',
    async generateBundle(options, bundles) {
      Object.values(bundles).forEach((bundle) => {
        if (bundle.type === 'chunk' && bundle.isEntry) {
          if (bundle.facadeModuleId) {
            const facadeInfo = this.getModuleInfo(bundle.facadeModuleId)
            // this info is exposed by rollup commonjs plugin
            if (facadeInfo?.meta?.commonjs?.isCommonJS) {
              const outputPath = path.join(cacheDir, bundle.fileName)
              const relativePath = slash(path.relative(root, outputPath))
              analysis.isCommonjs[relativePath] = true
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
