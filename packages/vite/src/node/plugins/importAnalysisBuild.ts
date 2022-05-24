import path from 'path'
import MagicString from 'magic-string'
import type { ImportSpecifier } from 'es-module-lexer'
import { init, parse as parseImports } from 'es-module-lexer'
import type { OutputChunk, SourceMap } from 'rollup'
import type { RawSourceMap } from '@ampproject/remapping'
import { combineSourcemaps, isRelativeBase } from '../utils'
import type { Plugin } from '../plugin'
import type { ResolvedConfig } from '../config'
import { genSourceMapUrl } from '../server/sourcemap'
import { removedPureCssFilesCache } from './css'

/**
 * A flag for injected helpers. This flag will be set to `false` if the output
 * target is not native es - so that injected helper logic can be conditionally
 * dropped.
 */
export const isModernFlag = `__VITE_IS_MODERN__`
export const preloadMethod = `__vitePreload`
export const preloadMarker = `__VITE_PRELOAD__`
export const preloadBaseMarker = `__VITE_PRELOAD_BASE__`

export const preloadHelperId = '\0vite/preload-helper'
const preloadMarkerWithQuote = `"${preloadMarker}"` as const

const dynamicImportPrefixRE = /import\s*\(/

/**
 * Helper for preloading CSS and direct imports of async chunks in parallel to
 * the async chunk itself.
 */

function detectScriptRel() {
  // @ts-ignore
  const relList = document.createElement('link').relList
  // @ts-ignore
  return relList && relList.supports && relList.supports('modulepreload')
    ? 'modulepreload'
    : 'preload'
}

declare const scriptRel: string
function preload(
  baseModule: () => Promise<{}>,
  deps?: string[],
  importerUrl?: string
) {
  // @ts-ignore
  if (!__VITE_IS_MODERN__ || !deps || deps.length === 0) {
    return baseModule()
  }

  return Promise.all(
    deps.map((dep) => {
      // @ts-ignore
      dep = assetsURL(dep, importerUrl)
      // @ts-ignore
      if (dep in seen) return
      // @ts-ignore
      seen[dep] = true
      const isCss = dep.endsWith('.css')
      const cssSelector = isCss ? '[rel="stylesheet"]' : ''
      // @ts-ignore check if the file is already preloaded by SSR markup
      if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
        return
      }
      // @ts-ignore
      const link = document.createElement('link')
      // @ts-ignore
      link.rel = isCss ? 'stylesheet' : scriptRel
      if (!isCss) {
        link.as = 'script'
        link.crossOrigin = ''
      }
      link.href = dep
      // @ts-ignore
      document.head.appendChild(link)
      if (isCss) {
        return new Promise((res, rej) => {
          link.addEventListener('load', res)
          link.addEventListener('error', () =>
            rej(new Error(`Unable to preload CSS for ${dep}`))
          )
        })
      }
    })
  ).then(() => baseModule())
}

/**
 * Build only. During serve this is performed as part of ./importAnalysis.
 */
export function buildImportAnalysisPlugin(config: ResolvedConfig): Plugin {
  const ssr = !!config.build.ssr
  const isWorker = config.isWorker
  const insertPreload = !(ssr || !!config.build.lib || isWorker)

  const relativeBase = isRelativeBase(config.base)

  const scriptRel = config.build.polyfillModulePreload
    ? `'modulepreload'`
    : `(${detectScriptRel.toString()})()`
  const assetsURL = relativeBase
    ? `function(dep,importerUrl) { return new URL(dep, importerUrl).href }`
    : `function(dep) { return ${JSON.stringify(config.base)}+dep }`
  const preloadCode = `const scriptRel = ${scriptRel};const assetsURL = ${assetsURL};const seen = {};export const ${preloadMethod} = ${preload.toString()}`

  return {
    name: 'vite:build-import-analysis',

    resolveId(id) {
      if (id === preloadHelperId) {
        return id
      }
    },

    load(id) {
      if (id === preloadHelperId) {
        return preloadCode
      }
    },

    async transform(source, importer) {
      if (
        importer.includes('node_modules') &&
        !dynamicImportPrefixRE.test(source)
      ) {
        return
      }

      await init

      let imports: readonly ImportSpecifier[] = []
      try {
        imports = parseImports(source)[0]
      } catch (e: any) {
        this.error(e, e.idx)
      }

      if (!imports.length) {
        return null
      }
      let s: MagicString | undefined
      const str = () => s || (s = new MagicString(source))
      let needPreloadHelper = false

      for (let index = 0; index < imports.length; index++) {
        const { ss: expStart, se: expEnd, d: dynamicIndex } = imports[index]

        const isDynamic = dynamicIndex > -1

        if (isDynamic && insertPreload) {
          needPreloadHelper = true
          str().prependLeft(expStart, `${preloadMethod}(() => `)
          str().appendRight(
            expEnd,
            `,${isModernFlag}?"${preloadMarker}":void 0${
              relativeBase ? ',import.meta.url' : ''
            })`
          )
        }
      }

      if (
        needPreloadHelper &&
        insertPreload &&
        !source.includes(`const ${preloadMethod} =`)
      ) {
        str().prepend(`import { ${preloadMethod} } from "${preloadHelperId}";`)
      }

      if (s) {
        return {
          code: s.toString(),
          map: config.build.sourcemap ? s.generateMap({ hires: true }) : null
        }
      }
    },

    renderChunk(code, _, { format }) {
      // make sure we only perform the preload logic in modern builds.
      if (code.indexOf(isModernFlag) > -1) {
        const re = new RegExp(isModernFlag, 'g')
        const isModern = String(format === 'es')
        if (config.build.sourcemap) {
          const s = new MagicString(code)
          let match: RegExpExecArray | null
          while ((match = re.exec(code))) {
            s.overwrite(
              match.index,
              match.index + isModernFlag.length,
              isModern,
              { contentOnly: true }
            )
          }
          return {
            code: s.toString(),
            map: s.generateMap({ hires: true })
          }
        } else {
          return code.replace(re, isModern)
        }
      }
      return null
    },

    generateBundle({ format }, bundle) {
      if (format !== 'es' || ssr || isWorker) {
        return
      }

      for (const file in bundle) {
        const chunk = bundle[file]
        // can't use chunk.dynamicImports.length here since some modules e.g.
        // dynamic import to constant json may get inlined.
        if (chunk.type === 'chunk' && chunk.code.indexOf(preloadMarker) > -1) {
          const code = chunk.code
          let imports: ImportSpecifier[]
          try {
            imports = parseImports(code)[0].filter((i) => i.d > -1)
          } catch (e: any) {
            this.error(e, e.idx)
          }

          const s = new MagicString(code)
          const rewroteMarkerStartPos = new Set() // position of the leading double quote

          if (imports.length) {
            for (let index = 0; index < imports.length; index++) {
              // To handle escape sequences in specifier strings, the .n field will be provided where possible.
              const {
                n: name,
                s: start,
                e: end,
                ss: expStart,
                se: expEnd
              } = imports[index]
              // check the chunk being imported
              let url = name
              if (!url) {
                const rawUrl = code.slice(start, end)
                if (rawUrl[0] === `"` && rawUrl[rawUrl.length - 1] === `"`)
                  url = rawUrl.slice(1, -1)
              }
              const deps: Set<string> = new Set()
              let hasRemovedPureCssChunk = false

              if (url) {
                const ownerFilename = chunk.fileName
                // literal import - trace direct imports and add to deps
                const analyzed: Set<string> = new Set<string>()
                const addDeps = (filename: string) => {
                  if (filename === ownerFilename) return
                  if (analyzed.has(filename)) return
                  analyzed.add(filename)
                  const chunk = bundle[filename] as OutputChunk | undefined
                  if (chunk) {
                    deps.add(chunk.fileName)
                    chunk.viteMetadata.importedCss.forEach((file) => {
                      deps.add(file)
                    })
                    chunk.imports.forEach(addDeps)
                  } else {
                    const removedPureCssFiles =
                      removedPureCssFilesCache.get(config)!
                    const chunk = removedPureCssFiles.get(filename)
                    if (chunk) {
                      if (chunk.viteMetadata.importedCss.size) {
                        chunk.viteMetadata.importedCss.forEach((file) => {
                          deps.add(file)
                        })
                        hasRemovedPureCssChunk = true
                      }

                      s.overwrite(expStart, expEnd, 'Promise.resolve({})', {
                        contentOnly: true
                      })
                    }
                  }
                }
                const normalizedFile = path.posix.join(
                  path.posix.dirname(chunk.fileName),
                  url
                )
                addDeps(normalizedFile)
              }

              let markerStartPos = code.indexOf(preloadMarkerWithQuote, end)
              // fix issue #3051
              if (markerStartPos === -1 && imports.length === 1) {
                markerStartPos = code.indexOf(preloadMarkerWithQuote)
              }

              if (markerStartPos > 0) {
                s.overwrite(
                  markerStartPos,
                  markerStartPos + preloadMarkerWithQuote.length,
                  // the dep list includes the main chunk, so only need to reload when there are
                  // actual other deps. Don't include the assets dir if the default asset file names
                  // are used, the path will be reconstructed by the import preload helper
                  deps.size > 1 ||
                    // main chunk is removed
                    (hasRemovedPureCssChunk && deps.size > 0)
                    ? `[${[...deps]
                        .map((d) =>
                          JSON.stringify(
                            relativeBase
                              ? path.relative(path.dirname(file), d)
                              : d
                          )
                        )
                        .join(',')}]`
                    : `[]`,
                  { contentOnly: true }
                )
                rewroteMarkerStartPos.add(markerStartPos)
              }
            }
          }

          // there may still be markers due to inlined dynamic imports, remove
          // all the markers regardless
          let markerStartPos = code.indexOf(preloadMarkerWithQuote)
          while (markerStartPos >= 0) {
            if (!rewroteMarkerStartPos.has(markerStartPos)) {
              s.overwrite(
                markerStartPos,
                markerStartPos + preloadMarkerWithQuote.length,
                'void 0',
                { contentOnly: true }
              )
            }

            markerStartPos = code.indexOf(
              preloadMarkerWithQuote,
              markerStartPos + preloadMarkerWithQuote.length
            )
          }

          if (s.hasChanged()) {
            chunk.code = s.toString()
            if (config.build.sourcemap && chunk.map) {
              const nextMap = s.generateMap({
                source: chunk.fileName,
                hires: true
              })
              const map = combineSourcemaps(
                chunk.fileName,
                [nextMap as RawSourceMap, chunk.map as RawSourceMap],
                false
              ) as SourceMap
              map.toUrl = () => genSourceMapUrl(map)
              chunk.map = map
            }
          }
        }
      }
    }
  }
}
