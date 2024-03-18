import { transform } from 'lightningcss'
import type { CSSModulesConfig } from 'lightningcss'
import type { CSSModuleData, RawSourceMap } from '../types'

export interface CompileOptions {
  cssModules?: CSSModulesConfig
  sourcemap?: boolean
}

export interface CompileResult {
  css: string
  map?: RawSourceMap
  data: CSSModuleData
}

export async function compileCSSModule(
  css: string,
  id: string,
  options?: CompileOptions,
): Promise<CompileResult> {
  const transformed = transform({
    filename: id,
    code: Buffer.from(css),
    cssModules: options?.cssModules ?? true,
    sourceMap: options?.sourcemap,
  })

  /**
   * Addresses non-deterministic exports order:
   * https://github.com/parcel-bundler/lightningcss/issues/291
   */
  const exports = Object.fromEntries(
    Object.entries(
      // `exports` is defined if cssModules is true
      transformed.exports!,
    ).sort(
      // Cheap alphabetical sort (localCompare is expensive)
      ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0),
    ),
  )

  const map = transformed.map
    ? (JSON.parse(Buffer.from(transformed.map).toString()) as RawSourceMap)
    : undefined

  return {
    css: transformed.code.toString(),
    map,
    data: {
      exports,
      references: transformed.references,
    },
  }
}
