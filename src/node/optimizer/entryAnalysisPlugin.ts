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

async function isCjs(filePath: string) {}

// function getCjsExports(
//   filePath: string,
//   result: { [exportName: string]: true }
// ) {
//   const content = fs.readFileSync(filePath, 'utf-8')
//   let parseResult: { exports: string[]; reexports: string[] }
//   try {
//     parseResult = parseCjs(content)
//   } catch (error) {
//     // not a commonjs module
//     return result
//   }
//   const { exports: cjsExports, reexports: cjsReExports } = parseResult
//   cjsExports.forEach((exportName: string) => {
//     result[exportName] = true
//   })
//   cjsReExports.forEach((cjsReExport: string) => {
//     // Example : react/index.js re-export from "./cjs/react.production.min.js"
//     const reExportsFiles = resolveFrom(path.dirname(filePath), cjsReExport)
//     getCjsExports(reExportsFiles, result)
//   })
//   return result
// }
