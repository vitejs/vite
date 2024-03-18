import { cssModuleToEsm } from '@vitejs/css-modules'
import type { CSSModuleData, CssModuleToEsmResult } from '@vitejs/css-modules'
import type { SourceMapInput } from 'rollup'
import type { Plugin } from '../plugin'
import type { ResolvedConfig } from '../config'
import { createCachedImport, removeDirectQuery } from '../utils'
import { CSS_LANGS_RE } from '../constants'
import { type CssLang, getAtImportResolvers, isModuleCSSRequest } from './css'

interface CSSModuleMetadata {
  /**
   * Transformed CSS
   */
  css: string
  /**
   * JS code for CSS module
   */
  code: string
  data: CSSModuleData
  /**
   * Metadata after finishing processing a CSS module file
   */
  exportsMetadata?: CssModuleToEsmResult['exportsMetadata']
}

export const cssModulesCache = new WeakMap<
  ResolvedConfig,
  Map<string, CSSModuleMetadata>
>()

// export function getCSSModuleResult(
//   id: string,
//   config: ResolvedConfig,
// ): Pick<CSSModuleMetadata, 'css' | 'code'> | undefined {
//   const cache = cssModulesCache.get(config)?.get(id)
//   if (cache) {
//     return { css: cache.css, code: cache.code }
//   }
// }

export function cssModulesPlugin(config: ResolvedConfig): Plugin {
  let moduleCache: Map<string, CSSModuleMetadata>

  return {
    name: 'vite:css-modules',

    buildStart() {
      // Ensure a new cache for every build (i.e. rebuilding in watch mode)
      moduleCache = new Map<string, CSSModuleMetadata>()
      cssModulesCache.set(config, moduleCache)
    },

    async transform(css, id) {
      if (!isModuleCSSRequest(id)) return

      const { css: newCss, map, data } = await compileCSSModule(css, id, config)

      const lang = id.match(CSS_LANGS_RE)?.[1] as CssLang | undefined
      const atImportResolvers = getAtImportResolvers(config)
      const resolver =
        lang === 'sass' || lang === 'scss'
          ? atImportResolvers.sass
          : lang === 'less'
            ? atImportResolvers.less
            : atImportResolvers.css

      const result = await cssModuleToEsm(
        {
          css: newCss,
          id,
          exports: data.exports,
          references: data.references,
          resolve: async (id, importer) => {
            return (await resolver(id, importer)) ?? id
          },
          loadExports: async (resolvedId) => {
            await this.load({ id: resolvedId })

            const modules = cssModulesCache.get(config)!.get(resolvedId)
            if (!modules || !modules.exportsMetadata) {
              throw new Error(
                `Failed to find exports from ${JSON.stringify(resolvedId)}`,
              )
            }
            return modules.exportsMetadata
          },
        },
        config.css.transformer === 'postcss'
          ? config.css.modules || undefined
          : undefined,
      )

      moduleCache.set(id, {
        css: result.css,
        code: result.code,
        data,
        exportsMetadata: result.exportsMetadata,
      })

      return {
        code: result.css,
        map,
      }
    },
  }
}

const importCssModulesPostcss = createCachedImport(
  () => import('@vitejs/css-modules/postcss'),
)
const importCssModulesLightningcss = createCachedImport(
  () => import('@vitejs/css-modules/lightningcss'),
)

async function compileCSSModule(
  css: string,
  id: string,
  config: ResolvedConfig,
): Promise<{
  css: string
  map?: SourceMapInput
  data: CSSModuleData
}> {
  id = removeDirectQuery(id)

  if (config.css?.transformer === 'lightningcss') {
    const { compileCSSModule: compile } = await importCssModulesLightningcss()
    const result = await compile(css, id, {
      cssModules: config.css.lightningcss?.cssModules,
      sourcemap: config.css.devSourcemap,
    })
    return {
      css: result.css,
      map: result.map as SourceMapInput,
      data: result.data,
    }
  } else {
    const { compileCSSModule: compile } = await importCssModulesPostcss()
    const result = await compile(css, id, {
      cssModules: config.css.modules || {},
      sourcemap: config.css.devSourcemap,
    })
    return {
      css: result.css,
      map: result.map as SourceMapInput,
      data: result.data,
    }
  }
}
