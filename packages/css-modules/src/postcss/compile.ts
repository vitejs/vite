import postcssModulesValues from 'postcss-modules-values'
import postcssModulesLocalByDefault from 'postcss-modules-local-by-default'
import postcssModulesExtractImports from 'postcss-modules-extract-imports'
import postcssModulesScope from 'postcss-modules-scope'
import genericNames from 'generic-names'
import postcss from 'postcss'
import type { CSSModuleData, CSSModulesOptions, RawSourceMap } from '../types'
import { postcssExtractIcss } from './postcss-extract-icss'

export interface CompileOptions {
  cssModules?: CSSModulesOptions
  sourcemap?: boolean
}

export interface CompileResult {
  css: string
  map?: RawSourceMap
  data: CSSModuleData
}

/**
 * For reference, postcss-modules's default:
 * https://github.com/madyankin/postcss-modules/blob/v6.0.0/src/scoping.js#L41
 *
 * I didn't add the line number because it seemed needless.
 * I increased the hash to 7 to follow Git's default for short SHA:
 * https://stackoverflow.com/a/18134919/911407
 *
 * FYI LightningCSS recommends hash first for grid compatibility,
 * https://github.com/parcel-bundler/lightningcss/blob/v1.23.0/website/pages/css-modules.md?plain=1#L237-L238
 *
 * but PostCSS CSS Modules doesn't seem to transform Grid names
 */
const defaultScopedName = '_[local]_[hash:7]'

export async function compileCSSModule(
  css: string,
  id: string,
  options?: CompileOptions,
): Promise<CompileResult> {
  const cssModules = options?.cssModules ?? {}
  const generateScopedName =
    typeof cssModules.generateScopedName === 'function'
      ? cssModules.generateScopedName
      : genericNames(cssModules.generateScopedName ?? defaultScopedName, {
          hashPrefix: cssModules.hashPrefix,
        })

  const isGlobal = cssModules.globalModulePaths?.some((pattern) =>
    pattern.test(id),
  )

  const localClasses: string[] = []
  let extracted: CSSModuleData

  const processed = postcss([
    postcssModulesValues,

    postcssModulesLocalByDefault({
      mode: isGlobal ? 'global' : cssModules.scopeBehaviour,
    }),

    // Declares imports from composes
    postcssModulesExtractImports(),

    // Resolves & removes composes
    postcssModulesScope({
      exportGlobals: cssModules.exportGlobals,
      generateScopedName: (exportName, resourceFile, rawCss) => {
        const scopedName = generateScopedName(exportName, resourceFile, rawCss)
        localClasses.push(scopedName)
        return scopedName
      },
    }),

    postcssExtractIcss({
      localClasses,
      onModuleExports: (_extracted) => {
        extracted = _extracted
      },
    }),
  ]).process(css, {
    from: id,
    map: options?.sourcemap
      ? {
          inline: false,
          annotation: false,
          sourcesContent: true,
        }
      : false,
  })

  return {
    css: processed.css,
    map: processed.map?.toJSON() as unknown as RawSourceMap,
    data: extracted!,
  }
}
