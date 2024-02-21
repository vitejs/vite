import path from 'node:path'
import MagicString from 'magic-string'
import type {
  ParseError as EsModuleLexerParseError,
  ImportSpecifier,
} from 'es-module-lexer'
import { init, parse as parseImports } from 'es-module-lexer'
import type { OutputChunk, SourceMap } from 'rollup'
import type { RawSourceMap } from '@ampproject/remapping'
import convertSourceMap from 'convert-source-map'
import {
  combineSourcemaps,
  generateCodeFrame,
  isInNodeModules,
  numberToPos,
} from '../utils'
import type { Plugin } from '../plugin'
import type { ResolvedConfig } from '../config'
import { toOutputFilePathInJS } from '../build'
import { genSourceMapUrl } from '../server/sourcemap'
import { removedPureCssFilesCache } from './css'
import { createParseErrorInfo } from './importAnalysis'

type FileDep = {
  url: string
  runtime: boolean
}

/**
 * A flag for injected helpers. This flag will be set to `false` if the output
 * target is not native es - so that injected helper logic can be conditionally
 * dropped.
 */
export const isModernFlag = `__VITE_IS_MODERN__`
export const preloadMethod = `__vitePreload`
export const preloadMarker = `__VITE_PRELOAD__`
export const preloadBaseMarker = `__VITE_PRELOAD_BASE__`

export const preloadHelperId = '\0vite/preload-helper.js'
const preloadMarkerWithQuote = new RegExp(`['"]${preloadMarker}['"]`, 'g')

const dynamicImportPrefixRE = /import\s*\(/

function toRelativePath(filename: string, importer: string) {
  const relPath = path.posix.relative(path.posix.dirname(importer), filename)
  return relPath[0] === '.' ? relPath : `./${relPath}`
}

function indexOfMatchInSlice(
  str: string,
  reg: RegExp,
  pos: number = 0,
): number {
  reg.lastIndex = pos
  const result = reg.exec(str)
  return result?.index ?? -1
}

/**
 * Helper for preloading CSS and direct imports of async chunks in parallel to
 * the async chunk itself.
 */

function detectScriptRel() {
  const relList =
    typeof document !== 'undefined' && document.createElement('link').relList
  return relList && relList.supports && relList.supports('modulepreload')
    ? 'modulepreload'
    : 'preload'
}

declare const scriptRel: string
declare const seen: Record<string, boolean>
function preload(
  baseModule: () => Promise<{}>,
  deps?: string[],
  importerUrl?: string,
) {
  let promise: Promise<unknown> = Promise.resolve()
  // @ts-expect-error __VITE_IS_MODERN__ will be replaced with boolean later
  if (__VITE_IS_MODERN__ && deps && deps.length > 0) {
    const links = document.getElementsByTagName('link')

    promise = Promise.all(
      deps.map((dep) => {
        // @ts-expect-error assetsURL is declared before preload.toString()
        dep = assetsURL(dep, importerUrl)
        if (dep in seen) return
        seen[dep] = true
        const isCss = dep.endsWith('.css')
        const cssSelector = isCss ? '[rel="stylesheet"]' : ''
        const isBaseRelative = !!importerUrl

        // check if the file is already preloaded by SSR markup
        if (isBaseRelative) {
          // When isBaseRelative is true then we have `importerUrl` and `dep` is
          // already converted to an absolute URL by the `assetsURL` function
          for (let i = links.length - 1; i >= 0; i--) {
            const link = links[i]
            // The `links[i].href` is an absolute URL thanks to browser doing the work
            // for us. See https://html.spec.whatwg.org/multipage/common-dom-interfaces.html#reflecting-content-attributes-in-idl-attributes:idl-domstring-5
            if (link.href === dep && (!isCss || link.rel === 'stylesheet')) {
              return
            }
          }
        } else if (
          document.querySelector(`link[href="${dep}"]${cssSelector}`)
        ) {
          return
        }

        const link = document.createElement('link')
        link.rel = isCss ? 'stylesheet' : scriptRel
        if (!isCss) {
          link.as = 'script'
          link.crossOrigin = ''
        }
        link.href = dep
        document.head.appendChild(link)
        if (isCss) {
          return new Promise((res, rej) => {
            link.addEventListener('load', res)
            link.addEventListener('error', () =>
              rej(new Error(`Unable to preload CSS for ${dep}`)),
            )
          })
        }
      }),
    )
  }

  return promise
    .then(() => baseModule())
    .catch((err) => {
      const e = new Event('vite:preloadError', { cancelable: true })
      // @ts-expect-error custom payload
      e.payload = err
      window.dispatchEvent(e)
      if (!e.defaultPrevented) {
        throw err
      }
    })
}

/**
 * Build only. During serve this is performed as part of ./importAnalysis.
 */
export function buildImportAnalysisPlugin(config: ResolvedConfig): Plugin {
  const ssr = !!config.build.ssr
  const isWorker = config.isWorker
  const insertPreload = !(ssr || !!config.build.lib || isWorker)

  const resolveModulePreloadDependencies =
    config.build.modulePreload && config.build.modulePreload.resolveDependencies
  const renderBuiltUrl = config.experimental.renderBuiltUrl
  const customModulePreloadPaths = !!(
    resolveModulePreloadDependencies || renderBuiltUrl
  )
  const isRelativeBase = config.base === './' || config.base === ''
  const optimizeModulePreloadRelativePaths =
    isRelativeBase && !customModulePreloadPaths

  const { modulePreload } = config.build
  const scriptRel =
    modulePreload && modulePreload.polyfill
      ? `'modulepreload'`
      : `(${detectScriptRel.toString()})()`

  // There are three different cases for the preload list format in __vitePreload
  //
  // __vitePreload(() => import(asyncChunk), [ ...deps... ])
  //
  // This is maintained to keep backwards compatibility as some users developed plugins
  // using regex over this list to workaround the fact that module preload wasn't
  // configurable.
  const assetsURL = customModulePreloadPaths
    ? // If `experimental.renderBuiltUrl` or `build.modulePreload.resolveDependencies` are used
      // the dependencies are already resolved. To avoid the need for `new URL(dep, import.meta.url)`
      // a helper `__vitePreloadRelativeDep` is used to resolve from relative paths which can be minimized.
      `function(dep, importerUrl) { return dep[0] === '.' ? new URL(dep, importerUrl).href : dep }`
    : optimizeModulePreloadRelativePaths
      ? // If there isn't custom resolvers affecting the deps list, deps in the list are relative
        // to the current chunk and are resolved to absolute URL by the __vitePreload helper itself.
        // The importerUrl is passed as third parameter to __vitePreload in this case
        `function(dep, importerUrl) { return new URL(dep, importerUrl).href }`
      : // If the base isn't relative, then the deps are relative to the projects `outDir` and the base
        // is appended inside __vitePreload too.
        `function(dep) { return ${JSON.stringify(config.base)}+dep }`
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
      if (isInNodeModules(importer) && !dynamicImportPrefixRE.test(source)) {
        return
      }

      await init

      let imports: readonly ImportSpecifier[] = []
      try {
        imports = parseImports(source)[0]
      } catch (_e: unknown) {
        const e = _e as EsModuleLexerParseError
        const { message, showCodeFrame } = createParseErrorInfo(
          importer,
          source,
        )
        this.error(message, showCodeFrame ? e.idx : undefined)
      }

      if (!imports.length) {
        return null
      }

      let s: MagicString | undefined
      const str = () => s || (s = new MagicString(source))
      let needPreloadHelper = false

      for (let index = 0; index < imports.length; index++) {
        const {
          e: end,
          ss: expStart,
          se: expEnd,
          d: dynamicIndex,
          a: attributeIndex,
        } = imports[index]

        const isDynamicImport = dynamicIndex > -1

        // strip import attributes as we can process them ourselves
        if (!isDynamicImport && attributeIndex > -1) {
          str().remove(end + 1, expEnd)
        }

        if (isDynamicImport && insertPreload) {
          needPreloadHelper = true
          str().prependLeft(expStart, `${preloadMethod}(() => `)
          str().appendRight(
            expEnd,
            `,${isModernFlag}?"${preloadMarker}":void 0${
              optimizeModulePreloadRelativePaths || customModulePreloadPaths
                ? ',import.meta.url'
                : ''
            })`,
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
          map: config.build.sourcemap
            ? s.generateMap({ hires: 'boundary' })
            : null,
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
            s.update(match.index, match.index + isModernFlag.length, isModern)
          }
          return {
            code: s.toString(),
            map: s.generateMap({ hires: 'boundary' }),
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
          let imports!: ImportSpecifier[]
          try {
            imports = parseImports(code)[0].filter((i) => i.d > -1)
          } catch (e: any) {
            const loc = numberToPos(code, e.idx)
            this.error({
              name: e.name,
              message: e.message,
              stack: e.stack,
              cause: e.cause,
              pos: e.idx,
              loc: { ...loc, file: chunk.fileName },
              frame: generateCodeFrame(code, loc),
            })
          }

          const s = new MagicString(code)
          const rewroteMarkerStartPos = new Set() // position of the leading double quote

          const fileDeps: FileDep[] = []
          const addFileDep = (
            url: string,
            runtime: boolean = false,
          ): number => {
            const index = fileDeps.findIndex((dep) => dep.url === url)
            if (index === -1) {
              return fileDeps.push({ url, runtime }) - 1
            } else {
              return index
            }
          }

          if (imports.length) {
            for (let index = 0; index < imports.length; index++) {
              // To handle escape sequences in specifier strings, the .n field will be provided where possible.
              const {
                n: name,
                s: start,
                e: end,
                ss: expStart,
                se: expEnd,
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

              let normalizedFile: string | undefined = undefined

              if (url) {
                normalizedFile = path.posix.join(
                  path.posix.dirname(chunk.fileName),
                  url,
                )

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
                    chunk.imports.forEach(addDeps)
                    // Ensure that the css imported by current chunk is loaded after the dependencies.
                    // So the style of current chunk won't be overwritten unexpectedly.
                    chunk.viteMetadata!.importedCss.forEach((file) => {
                      deps.add(file)
                    })
                  } else {
                    const removedPureCssFiles =
                      removedPureCssFilesCache.get(config)!
                    const chunk = removedPureCssFiles.get(filename)
                    if (chunk) {
                      if (chunk.viteMetadata!.importedCss.size) {
                        chunk.viteMetadata!.importedCss.forEach((file) => {
                          deps.add(file)
                        })
                        hasRemovedPureCssChunk = true
                      }

                      s.update(expStart, expEnd, 'Promise.resolve({})')
                    }
                  }
                }
                addDeps(normalizedFile)
              }

              let markerStartPos = indexOfMatchInSlice(
                code,
                preloadMarkerWithQuote,
                end,
              )
              // fix issue #3051
              if (markerStartPos === -1 && imports.length === 1) {
                markerStartPos = indexOfMatchInSlice(
                  code,
                  preloadMarkerWithQuote,
                )
              }

              if (markerStartPos > 0) {
                // the dep list includes the main chunk, so only need to reload when there are actual other deps.
                const depsArray =
                  deps.size > 1 ||
                  // main chunk is removed
                  (hasRemovedPureCssChunk && deps.size > 0)
                    ? modulePreload === false
                      ? // CSS deps use the same mechanism as module preloads, so even if disabled,
                        // we still need to pass these deps to the preload helper in dynamic imports.
                        [...deps].filter((d) => d.endsWith('.css'))
                      : [...deps]
                    : []

                let renderedDeps: number[]
                if (normalizedFile && customModulePreloadPaths) {
                  const { modulePreload } = config.build
                  const resolveDependencies = modulePreload
                    ? modulePreload.resolveDependencies
                    : undefined
                  let resolvedDeps: string[]
                  if (resolveDependencies) {
                    // We can't let the user remove css deps as these aren't really preloads, they are just using
                    // the same mechanism as module preloads for this chunk
                    const cssDeps: string[] = []
                    const otherDeps: string[] = []
                    for (const dep of depsArray) {
                      ;(dep.endsWith('.css') ? cssDeps : otherDeps).push(dep)
                    }
                    resolvedDeps = [
                      ...resolveDependencies(normalizedFile, otherDeps, {
                        hostId: file,
                        hostType: 'js',
                      }),
                      ...cssDeps,
                    ]
                  } else {
                    resolvedDeps = depsArray
                  }

                  renderedDeps = resolvedDeps.map((dep) => {
                    const replacement = toOutputFilePathInJS(
                      dep,
                      'asset',
                      chunk.fileName,
                      'js',
                      config,
                      toRelativePath,
                    )

                    if (typeof replacement === 'string') {
                      return addFileDep(replacement)
                    }

                    return addFileDep(replacement.runtime, true)
                  })
                } else {
                  renderedDeps = depsArray.map((d) =>
                    // Don't include the assets dir if the default asset file names
                    // are used, the path will be reconstructed by the import preload helper
                    optimizeModulePreloadRelativePaths
                      ? addFileDep(toRelativePath(d, file))
                      : addFileDep(d),
                  )
                }

                s.update(
                  markerStartPos,
                  markerStartPos + preloadMarker.length + 2,
                  `__vite__mapDeps([${renderedDeps.join(',')}])`,
                )
                rewroteMarkerStartPos.add(markerStartPos)
              }
            }
          }

          const fileDepsCode = `[${fileDeps
            .map((fileDep) =>
              fileDep.runtime ? fileDep.url : JSON.stringify(fileDep.url),
            )
            .join(',')}]`

          const mapDepsCode = `\
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ${fileDepsCode}
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}\n`

          // inject extra code at the top or next line of hashbang
          if (code.startsWith('#!')) {
            s.prependLeft(code.indexOf('\n') + 1, mapDepsCode)
          } else {
            s.prepend(mapDepsCode)
          }

          // there may still be markers due to inlined dynamic imports, remove
          // all the markers regardless
          let markerStartPos = indexOfMatchInSlice(code, preloadMarkerWithQuote)
          while (markerStartPos >= 0) {
            if (!rewroteMarkerStartPos.has(markerStartPos)) {
              s.update(
                markerStartPos,
                markerStartPos + preloadMarker.length + 2,
                'void 0',
              )
            }
            markerStartPos = indexOfMatchInSlice(
              code,
              preloadMarkerWithQuote,
              markerStartPos + preloadMarker.length + 2,
            )
          }

          if (s.hasChanged()) {
            chunk.code = s.toString()
            if (config.build.sourcemap && chunk.map) {
              const nextMap = s.generateMap({
                source: chunk.fileName,
                hires: 'boundary',
              })
              const map = combineSourcemaps(chunk.fileName, [
                nextMap as RawSourceMap,
                chunk.map as RawSourceMap,
              ]) as SourceMap
              map.toUrl = () => genSourceMapUrl(map)
              chunk.map = map

              if (config.build.sourcemap === 'inline') {
                chunk.code = chunk.code.replace(
                  convertSourceMap.mapFileCommentRegex,
                  '',
                )
                chunk.code += `\n//# sourceMappingURL=${genSourceMapUrl(map)}`
              } else if (config.build.sourcemap) {
                const mapAsset = bundle[chunk.fileName + '.map']
                if (mapAsset && mapAsset.type === 'asset') {
                  mapAsset.source = map.toString()
                }
              }
            }
          }
        }
      }
    },
  }
}
