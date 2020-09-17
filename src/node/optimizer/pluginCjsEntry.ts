import fs from 'fs-extra'
import * as path from 'path'
import { Plugin } from 'rollup'
// @ts-ignore
import cjsLexer from 'cjs-module-lexer'
const { init: initCjsLexer, parse: parseCjs } = cjsLexer

export function createCjsEntryNamedExportPlugin(): Plugin {
  const proxyEntries: { [proxyModuleId: string]: string } = {}
  return {
    name: 'vite:cjs-entry-named-export',
    // @ts-ignore
    async options(opts) {
      const input = opts.input
      await initCjsLexer()
      if (typeof input !== 'object' || Array.isArray(input)) {
        throw new Error('expect rollup input to be object')
      }
      Object.entries(input).map(([id, entryFilePath]) => {
        const cjsExports = Object.keys(getCjsExports(entryFilePath, {}))
        if (cjsExports.length > 0) {
          debugger
          const exportCode: string[] = [
            `import * as __proxied_cjs_module__ from '${entryFilePath}'`,
            // @rollup/plugin-commonjs creates a default export for each cjs module
            `export { default } from '${entryFilePath}';`
          ]
          cjsExports
            .filter((exportName) => exportName !== 'default')
            .forEach((exportName) => {
              exportCode.push(
                `export const ${exportName} = __proxied_cjs_module__['${exportName}'];`
              )
            })
          const proxyModuleId = `\0@proxyEntries/${id}`
          proxyEntries[proxyModuleId] = exportCode.join('\n')
          input[id] = proxyModuleId
        }
      })
      return opts
    },
    resolveId(importee, importer) {
      if (proxyEntries[importee]) return importee
    },
    load(id) {
      if (proxyEntries[id]) return proxyEntries[id]
    }
  }
}

function getCjsExports(
  filePath: string,
  result: { [exportName: string]: true }
) {
  const content = fs.readFileSync(filePath, 'utf-8')
  let parseResult: { exports: string[]; reexports: string[] }
  try {
    parseResult = parseCjs(content)
  } catch (error) {
    // not a commonjs module
    return result
  }
  const { exports: cjsExports, reexports: cjsReExports } = parseResult
  cjsExports.forEach((exportName: string) => {
    result[exportName] = true
  })
  cjsReExports.forEach((cjsReExport: string) => {
    // Example : /node_modules/react/index.js re-export from "./cjs/react.production.min.js"
    const reExportsFiles = path.resolve(path.dirname(filePath), cjsReExport)
    getCjsExports(reExportsFiles, result)
  })
  return result
}
