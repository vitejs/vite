import MagicString from 'magic-string'
import type { RawSourceMap } from '@ampproject/remapping'
import type { Exports, Imports } from './utils/generate-esm'
import { generateEsm } from './utils/generate-esm'
import {
  getLocalesConventionFunction,
  shouldKeepOriginalExport,
} from './utils/locals-convention'
import type {
  CSSModuleExports,
  CSSModuleReferences,
  CSSModulesOptions,
} from './types'

export interface CssModuleToEsmOptions {
  css: string
  id: string
  exports: CSSModuleExports
  references: CSSModuleReferences
  resolve: (id: string, importer: string) => Promise<string>
  loadExports: (resolvedId: string) => Promise<Exports>
  sourcemap?: boolean
  includeArbitraryNames?: boolean
}

export interface CssModuleToEsmResult {
  code: string
  css: string
  exportsMetadata: Exports
  map?: RawSourceMap
}

export async function cssModuleToEsm(
  options: CssModuleToEsmOptions,
  cssModulesOptions: CSSModulesOptions = {},
): Promise<CssModuleToEsmResult> {
  let outputCss = options.css
  const imports: Imports = new Map()
  let counter = 0

  const keepOriginalExport = shouldKeepOriginalExport(cssModulesOptions)
  const localsConventionFunction =
    getLocalesConventionFunction(cssModulesOptions)

  const registerImport = (fromFile: string, exportName?: string) => {
    let importFrom = imports.get(fromFile)
    if (!importFrom) {
      importFrom = {}
      imports.set(fromFile, importFrom)
    }

    if (!exportName) {
      return
    }

    if (!importFrom[exportName]) {
      importFrom[exportName] = `_${counter}`
      counter += 1
    }
    return importFrom[exportName]
  }

  const exports: Exports = {}

  await Promise.all(
    Object.entries(options.exports).map(async ([exportName, exported]) => {
      const exportAs = new Set<string>()
      if (keepOriginalExport) {
        exportAs.add(exportName)
      }

      let code: string
      let resolved: string
      if (typeof exported === 'string') {
        const transformedExport = localsConventionFunction?.(
          exportName,
          exportName,
          options.id,
        )
        if (transformedExport) {
          exportAs.add(transformedExport)
        }
        code = exported
        resolved = exported
      } else {
        const transformedExport = localsConventionFunction?.(
          exportName,
          exported.name,
          options.id,
        )
        if (transformedExport) {
          exportAs.add(transformedExport)
        }

        // Collect composed classes
        const composedClasses = await Promise.all(
          exported.composes.map(async (dep) => {
            if (dep.type === 'dependency') {
              const resolvedId = await options.resolve(
                dep.specifier,
                options.id,
              )
              const loaded = await options.loadExports(resolvedId)
              const exportedEntry = loaded[dep.name]!
              if (!exportedEntry) {
                throw new Error(
                  `Cannot resolve ${JSON.stringify(dep.name)} from ${JSON.stringify(dep.specifier)}`,
                )
              }
              const [exportAsName] = Array.from(exportedEntry.exportAs)
              const importedAs = registerImport(resolvedId, exportAsName)!
              return {
                resolved: exportedEntry.resolved,
                code: `\${${importedAs}}`,
              }
            }

            return {
              resolved: dep.name,
              code: dep.name,
            }
          }),
        )
        code = [exported.name, ...composedClasses.map((c) => c.code)].join(' ')
        resolved = [
          exported.name,
          ...composedClasses.map((c) => c.resolved),
        ].join(' ')
      }

      exports[exportName] = {
        code,
        resolved,
        exportAs,
      }
    }),
  )

  let map: RawSourceMap | undefined

  // Inject CSS Modules values
  const references = Object.entries(options.references)
  if (references.length > 0) {
    const ms = new MagicString(outputCss)
    await Promise.all(
      references.map(async ([placeholder, source]) => {
        const resolvedId = await options.resolve(source.specifier, options.id)
        const loaded = await options.loadExports(resolvedId)
        const exported = loaded[source.name]
        if (!exported) {
          throw new Error(
            `Cannot resolve "${source.name}" from "${source.specifier}"`,
          )
        }

        registerImport(source.specifier)
        ms.replaceAll(placeholder, exported.code)
      }),
    )
    outputCss = ms.toString()
    map = options.sourcemap
      ? (ms.generateMap({
          source: options.id,
          file: options.id,
          includeContent: true,
        }) as RawSourceMap)
      : undefined
  }

  if (cssModulesOptions.getJSON) {
    const json: Record<string, string> = {}
    for (const exported of Object.values(exports)) {
      for (const exportAs of exported.exportAs) {
        json[exportAs] = exported.resolved
      }
    }

    cssModulesOptions.getJSON(options.id, json, options.id)
  }

  const jsCode = generateEsm(imports, exports, options.includeArbitraryNames)

  return {
    code: jsCode,
    css: outputCss,
    exportsMetadata: exports,
    map,
  }
}
