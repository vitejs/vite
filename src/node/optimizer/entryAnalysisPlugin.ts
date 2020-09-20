import { Plugin } from 'rollup'
import { init, parse } from 'es-module-lexer'
import * as fs from 'fs-extra'

export function entryAnalysisPlugin(): Plugin {
  const analysis: { mayBeCjs: { [name: string]: true } } = { mayBeCjs: {} }
  return {
    name: 'vite:cjs-entry-named-export',
    async generateBundle(options, bundles) {
      await init
      Object.values(bundles).forEach((bundle) => {
        if (bundle.type === 'chunk' && bundle.isEntry) {
          if (bundle.facadeModuleId) {
            const [, exports] = parse(
              fs.readFileSync(bundle.facadeModuleId, 'utf-8')
            )
            if (exports.length === 0) {
              // likely commonjs
              analysis.mayBeCjs[bundle.name] = true
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
