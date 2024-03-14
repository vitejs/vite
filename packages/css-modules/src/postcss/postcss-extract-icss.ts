import type { PluginCreator } from 'postcss'
import { type CSSExports, extractICSS } from 'icss-utils'
import type {
  CSSModuleData,
  CSSModuleExports,
  CSSModuleReferences,
  DependencyReference,
} from '../types'

type onModuleExports = (moduleExports: CSSModuleData) => void

type Options = {
  onModuleExports: onModuleExports
  localClasses: string[]
}

const processExracted = (
  icssExports: CSSExports,
  dependencies: Map<string, DependencyReference>,
  localClasses: string[],
): CSSModuleData => {
  const exports: CSSModuleExports = {}
  const references: CSSModuleReferences = {}

  for (const [exportedAs, value] of Object.entries(icssExports)) {
    // TODO: This should be a stricter check using \b
    const hasLocalClass = localClasses.some((localClass) =>
      value.includes(localClass),
    )
    if (hasLocalClass) {
      const [firstClass, ...composed] = value.split(' ')
      exports[exportedAs] = {
        name: firstClass!,
        composes: composed.map((className) => {
          if (localClasses.includes(className)) {
            return {
              type: 'local',
              name: className,
            }
          }

          if (dependencies.has(className)) {
            return dependencies.get(className)!
          }

          return {
            type: 'global',
            name: className,
          }
        }),
      }
    } else if (dependencies.has(value)) {
      references[value] = dependencies.get(value)!
    } else {
      exports[exportedAs] = value
    }
  }

  return {
    exports,
    references,
  }
}

export const postcssExtractIcss: PluginCreator<Options> = (options) => ({
  postcssPlugin: 'extract-icss',
  OnceExit: (root) => {
    const { icssImports, icssExports } = extractICSS(root)
    const dependencies = new Map<string /* hash */, DependencyReference>(
      Object.entries(icssImports).flatMap(([filePath, fileImports]) =>
        Object.entries(fileImports).map(
          ([hash, name]): [string, DependencyReference] => [
            hash,
            Object.freeze({
              type: 'dependency',
              name,
              specifier: filePath,
            }),
          ],
        ),
      ),
    )

    const extracted = processExracted(
      icssExports,
      dependencies,
      options!.localClasses,
    )

    options!.onModuleExports(extracted)
  },
})

postcssExtractIcss.postcss = true
