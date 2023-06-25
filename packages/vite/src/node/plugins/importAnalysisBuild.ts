import path from 'node:path'
import MagicString from 'magic-string'
import type { ImportSpecifier } from 'es-module-lexer'
import { init, parse as parseImports } from 'es-module-lexer'
import type { OutputChunk, RenderedChunk, SourceMap } from 'rollup'
import colors from 'picocolors'
import type { RawSourceMap } from '@ampproject/remapping'
import convertSourceMap from 'convert-source-map'
import {
  bareImportRE,
  cleanUrl,
  combineSourcemaps,
  isDataUrl,
  isExternalUrl,
  isInNodeModules,
  moduleListContains,
} from '../utils'
import type { Plugin } from '../plugin'
import { getDepOptimizationConfig } from '../config'
import type { ResolvedConfig } from '../config'
import { toOutputFilePathInJS } from '../build'
import { genSourceMapUrl } from '../server/sourcemap'
import { getDepsOptimizer, optimizedDepNeedsInterop } from '../optimizer'
import { SPECIAL_QUERY_RE } from '../constants'
import { calcEmptyChunkRE, isCSSRequest, removedPureCssFilesCache } from './css'
import { interopNamedImports } from './importAnalysis'

/**
 * A flag for injected helpers. This flag will be set to `false` if the output
 * target is not native es - so that injected helper logic can be conditionally
 * dropped.
 */
export const isModernFlag = `__VITE_IS_MODERN__`
export const preloadMethod = `__vitePreload`
export const preloadCallMethod = `__vitePreloadCall`
export const preloadMarker = `__VITE_PRELOAD__`
export const preloadBaseMarker = `__VITE_PRELOAD_BASE__`
export const preloadListMarker = `__VITE_PRELOAD_LIST__`
export const preloadLegacyImportsToken = `window.__viteLegacyImports`

export const preloadHelperId = '\0vite/preload-helper'
const preloadMarkerWithQuote = new RegExp(`['"]${preloadMarker}['"]`)

const dynamicImportPrefixRE = /import\s*\(/

// TODO: abstract
const optimizedDepChunkRE = /\/chunk-[A-Z\d]{8}\.js/
const optimizedDepDynamicRE = /-[A-Z\d]{8}\.js/

function toRelativePath(filename: string, importer: string) {
  const relPath = path.relative(path.dirname(importer), filename)
  return relPath[0] === '.' ? relPath : `./${relPath}`
}

function indexOfMatchInSlice(
  str: string,
  reg: RegExp,
  pos: number = 0,
): number {
  if (pos !== 0) {
    str = str.slice(pos)
  }

  const matcher = str.match(reg)

  return matcher?.index !== undefined ? matcher.index + pos : -1
}

/**
 * Helper for preloading CSS and direct imports of async chunks in parallel to
 * the async chunk itself.
 */

function detectScriptRel() {
  const relList = document.createElement('link').relList
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
  if (!deps || deps.length === 0) {
    return baseModule()
  }

  const links = document.getElementsByTagName('link')

  return Promise.all(
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
      } else if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
        return
      }

      const loadLink = () => {
        const link = document.createElement('link')
        link.rel = isCss ? 'stylesheet' : scriptRel
        if (!isCss) {
          link.as = 'script'
          link.crossOrigin = ''
        }
        link.href = dep
        document.head.appendChild(link)
        return link
      }

      if (isCss) {
        // @ts-expect-error __VITE_IS_MODERN__ will be replaced with boolean later
        if (__VITE_IS_MODERN__) {
          return new Promise<void>((res, rej) => {
            const link = loadLink()
            link.addEventListener('load', () => res())
            link.addEventListener('error', () =>
              rej(new Error(`Unable to preload CSS for ${dep}`)),
            )
          })
        } else {
          return new Promise<void>((res) => {
            const img = new Image()
            img.onerror = () => res()
            img.onload = () => res()
            img.src = dep
          }).then(
            () =>
              new Promise<void>((res) => {
                loadLink()
                // On legacy browsers, let them a chance to process the newly referred CSS link.
                setTimeout(res)
              }),
          )
        }
      } else {
        loadLink()
      }
    }),
  )
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
  const insertPreload = !(
    ssr ||
    !!config.build.lib ||
    isWorker ||
    config.build.modulePreload === false
  )

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

  const resolveEmptyModule = `Promise.resolve([[], () => ({ setters: [], execute: () => ({}) })])`
  const systemHookingCode = `
    if (${preloadLegacyImportsToken} === undefined) {
      ${preloadLegacyImportsToken} = {}
      const originalInstantiate = System.constructor.prototype.instantiate
      System.constructor.prototype.instantiate = function (url, parentUrl) {
        const callOriginal = () => originalInstantiate.call(this, url, parentUrl)
        const importInfo = ${preloadLegacyImportsToken}[assetsURL(url, import.meta.url)]
        return importInfo
          ? ${preloadMethod}((importInfo.pure ? ${resolveEmptyModule} : callOriginal), importInfo.deps, import.meta.url)
          : callOriginal()
      }
    }
    ${preloadListMarker}.forEach((data) => {
      ${preloadLegacyImportsToken}[assetsURL(data[0], import.meta.url)] = {
        deps: data[1],
        pure: data.length === 3
      }
    })
  `

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
      // a helper `assetsURL` function is used to resolve from relative paths which can be minimized.
      `function(dep, importerUrl) { return dep.startsWith('.') ? new URL(dep, importerUrl).href : dep }`
    : optimizeModulePreloadRelativePaths
    ? // If there isn't custom resolvers affecting the deps list, deps in the list are relative
      // to the current chunk and are resolved to absolute URL by the __vitePreload helper itself.
      // The importerUrl is passed as third parameter to __vitePreload in this case
      `function(dep, importerUrl) { return new URL(dep, importerUrl).href }`
    : // If the base isn't relative, then the deps are relative to the projects `outDir` and the base
      // is appended inside __vitePreload too.
      `function(dep) { return ${JSON.stringify(config.base)}+dep }`
  const preloadCode = `const scriptRel = ${scriptRel};const assetsURL = ${assetsURL};const seen = {};const ${preloadMethod} = ${preload.toString()};export const ${preloadCallMethod} = ${isModernFlag} ? ${preloadMethod} : (baseModule) => baseModule();if(!${isModernFlag}){${systemHookingCode}}`

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
      } catch (e: any) {
        this.error(e, e.idx)
      }

      if (!imports.length) {
        return null
      }

      const { root } = config
      const depsOptimizer = getDepsOptimizer(config, ssr)

      const normalizeUrl = async (
        url: string,
        pos: number,
      ): Promise<[string, string]> => {
        let importerFile = importer

        const optimizeDeps = getDepOptimizationConfig(config, ssr)
        if (moduleListContains(optimizeDeps?.exclude, url)) {
          if (depsOptimizer) {
            await depsOptimizer.scanProcessing

            // if the dependency encountered in the optimized file was excluded from the optimization
            // the dependency needs to be resolved starting from the original source location of the optimized file
            // because starting from node_modules/.vite will not find the dependency if it was not hoisted
            // (that is, if it is under node_modules directory in the package source of the optimized file)
            for (const optimizedModule of depsOptimizer.metadata.depInfoList) {
              if (!optimizedModule.src) continue // Ignore chunks
              if (optimizedModule.file === importer) {
                importerFile = optimizedModule.src
              }
            }
          }
        }

        const resolved = await this.resolve(url, importerFile)

        if (!resolved) {
          // in ssr, we should let node handle the missing modules
          if (ssr) {
            return [url, url]
          }
          return this.error(
            `Failed to resolve import "${url}" from "${path.relative(
              process.cwd(),
              importerFile,
            )}". Does the file exist?`,
            pos,
          )
        }

        // normalize all imports into resolved URLs
        // e.g. `import 'foo'` -> `import '/@fs/.../node_modules/foo/index.js'`
        if (resolved.id.startsWith(root + '/')) {
          // in root: infer short absolute path from root
          url = resolved.id.slice(root.length)
        } else {
          url = resolved.id
        }

        if (isExternalUrl(url)) {
          return [url, url]
        }

        return [url, resolved.id]
      }

      let s: MagicString | undefined
      const str = () => s || (s = new MagicString(source))
      let needPreloadHelper = false

      for (let index = 0; index < imports.length; index++) {
        const {
          s: start,
          e: end,
          ss: expStart,
          se: expEnd,
          n: specifier,
          d: dynamicIndex,
          a: assertIndex,
        } = imports[index]

        const isDynamicImport = dynamicIndex > -1

        // strip import assertions as we can process them ourselves
        if (!isDynamicImport && assertIndex > -1) {
          str().remove(end + 1, expEnd)
        }

        if (isDynamicImport && insertPreload) {
          needPreloadHelper = true
          str().prependLeft(expStart, `${preloadCallMethod}(() => `)
          str().appendRight(
            expEnd,
            `,"${preloadMarker}"${
              optimizeModulePreloadRelativePaths || customModulePreloadPaths
                ? ',import.meta.url'
                : ''
            })`,
          )
        }

        // static import or valid string in dynamic import
        // If resolvable, let's resolve it
        if (depsOptimizer && specifier) {
          // skip external / data uri
          if (isExternalUrl(specifier) || isDataUrl(specifier)) {
            continue
          }

          // normalize
          const [url, resolvedId] = await normalizeUrl(specifier, start)

          if (url !== specifier) {
            if (
              depsOptimizer.isOptimizedDepFile(resolvedId) &&
              !resolvedId.match(optimizedDepChunkRE)
            ) {
              const file = cleanUrl(resolvedId) // Remove ?v={hash}

              const needsInterop = await optimizedDepNeedsInterop(
                depsOptimizer.metadata,
                file,
                config,
                ssr,
              )

              let rewriteDone = false

              if (needsInterop === undefined) {
                // Non-entry dynamic imports from dependencies will reach here as there isn't
                // optimize info for them, but they don't need es interop. If the request isn't
                // a dynamic import, then it is an internal Vite error
                if (!file.match(optimizedDepDynamicRE)) {
                  config.logger.error(
                    colors.red(
                      `Vite Error, ${url} optimized info should be defined`,
                    ),
                  )
                }
              } else if (needsInterop) {
                // config.logger.info(`${url} needs interop`)
                interopNamedImports(
                  str(),
                  imports[index],
                  url,
                  index,
                  importer,
                  config,
                )
                rewriteDone = true
              }
              if (!rewriteDone) {
                const rewrittenUrl = JSON.stringify(file)
                const s = isDynamicImport ? start : start - 1
                const e = isDynamicImport ? end : end + 1
                str().update(s, e, rewrittenUrl)
              }
            }
          }
        }

        // Differentiate CSS imports that use the default export from those that
        // do not by injecting a ?used query - this allows us to avoid including
        // the CSS string when unnecessary (esbuild has trouble tree-shaking
        // them)
        if (
          specifier &&
          isCSSRequest(specifier) &&
          // always inject ?used query when it is a dynamic import
          // because there is no way to check whether the default export is used
          (source.slice(expStart, start).includes('from') || isDynamicImport) &&
          // already has ?used query (by import.meta.glob)
          !specifier.match(/\?used(&|$)/) &&
          // don't append ?used when SPECIAL_QUERY_RE exists
          !specifier.match(SPECIAL_QUERY_RE) &&
          // edge case for package names ending with .css (e.g normalize.css)
          !(bareImportRE.test(specifier) && !specifier.includes('/'))
        ) {
          const url = specifier.replace(/\?|$/, (m) => `?used${m ? '&' : ''}`)
          str().update(start, end, isDynamicImport ? `'${url}'` : url)
        }
      }

      if (
        needPreloadHelper &&
        insertPreload &&
        !source.includes(`const ${preloadCallMethod} =`)
      ) {
        str().prepend(
          `import { ${preloadCallMethod} } from "${preloadHelperId}";`,
        )
      }

      if (s) {
        return {
          code: s.toString(),
          map: config.build.sourcemap ? s.generateMap({ hires: true }) : null,
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
            map: s.generateMap({ hires: true }),
          }
        } else {
          return code.replace(re, isModern)
        }
      }
      return null
    },

    generateBundle({ format }, bundle) {
      if (
        (format !== 'es' && format !== 'system') ||
        ssr ||
        isWorker ||
        config.build.modulePreload === false
      ) {
        return
      }

      const removedPureCssFiles = removedPureCssFilesCache.get(config)!
      const removedPureCssFilesNames =
        format !== 'system' ? undefined : [...removedPureCssFiles.keys()]

      const createAddDepsFunc = (
        deps: Set<string>,
        ownerFilename: string,
        onRemovedPureCss: (chunk: RenderedChunk) => void,
      ) => {
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
            const chunk = removedPureCssFiles.get(filename)
            if (chunk) {
              chunk.viteMetadata!.importedCss.forEach((file) => {
                deps.add(file)
              })

              onRemovedPureCss(chunk)
            }
          }
        }
        return addDeps
      }

      const calcRenderedDeps = (
        normalizedFile: string | undefined,
        depsArray: string[],
        file: string,
        chunk: RenderedChunk,
      ) => {
        if (normalizedFile && customModulePreloadPaths) {
          const { modulePreload } = config.build
          const resolveDependencies =
            modulePreload && modulePreload.resolveDependencies
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

          return resolvedDeps.map((dep: string) => {
            const replacement = toOutputFilePathInJS(
              dep,
              'asset',
              chunk.fileName,
              'js',
              config,
              toRelativePath,
            )
            const replacementString =
              typeof replacement === 'string'
                ? JSON.stringify(replacement)
                : replacement.runtime

            return replacementString
          })
        } else {
          return depsArray.map((d) =>
            // Don't include the assets dir if the default asset file names
            // are used, the path will be reconstructed by the import preload helper
            JSON.stringify(
              optimizeModulePreloadRelativePaths ? toRelativePath(d, file) : d,
            ),
          )
        }
      }

      for (const file in bundle) {
        const chunk = bundle[file]

        if (chunk.type !== 'chunk') continue

        const code = chunk.code
        const s = new MagicString(code)

        if (chunk.code.indexOf(preloadListMarker) > -1) {
          interface ImportInfo {
            pure: boolean
            deps: string[]
          }
          const importInfoMap: Record<string, ImportInfo> = {}

          if (format === 'system') {
            for (let index = 0; index < chunk.dynamicImports.length; index++) {
              const normalizedFile = chunk.dynamicImports[index]
              const deps: Set<string> = new Set()

              let hasRemovedPureCssChunk = false
              let selfIsPureCssChunk = false

              createAddDepsFunc(deps, chunk.fileName, (chunk) => {
                if (chunk.viteMetadata!.importedCss.size) {
                  hasRemovedPureCssChunk = true
                }
                selfIsPureCssChunk = true
              })(normalizedFile)

              // the dep list includes the main chunk, so only need to reload when there are actual other deps.
              const depsArray =
                deps.size > 1 ||
                // main chunk is removed
                (hasRemovedPureCssChunk && deps.size > 0)
                  ? [...deps]
                  : []

              const renderedDeps = calcRenderedDeps(
                normalizedFile,
                depsArray,
                file,
                chunk,
              )
              // notice that deps here are already renderered as a JS expression
              const importInfo: ImportInfo = {
                deps: renderedDeps,
                pure: selfIsPureCssChunk,
              }
              if (importInfo.deps.length > 0 || importInfo.pure) {
                importInfoMap[toRelativePath(normalizedFile, file)] = importInfo
              }
            }

            // since in system format we can't remove pure css imports safely, we add them to the import info list, marked as pure.
            // notice that this regexp gives us a list of potential imports(almost exact),
            //  and some elements might not get imported at all in the chunk, since there might be places of `(...).import(..)` )
            //  in the code that doesn't refer to a SystemJS import.
            if (removedPureCssFilesNames!.length > 0) {
              const emptyChunkRE = calcEmptyChunkRE(
                removedPureCssFilesNames!,
                'system',
              )
              for (const match of code.matchAll(emptyChunkRE)) {
                const removedImportRelative = toRelativePath(match[1], file)
                if (importInfoMap[removedImportRelative] === undefined) {
                  // if not scanned already, it must have no deps
                  importInfoMap[removedImportRelative] = {
                    deps: [],
                    pure: true,
                  }
                }
              }
            }
          }

          s.replace(
            preloadListMarker,
            `[${Object.entries(importInfoMap)
              .map(
                ([importFile, { deps, pure }]) =>
                  `[${JSON.stringify(importFile)},[${deps.join(',')}]${
                    pure ? ',1' : ''
                  }]`,
              )
              .join(',')}]`,
          )
        }

        // can't use chunk.dynamicImports.length here since some modules e.g.
        // dynamic import to constant json may get inlined.
        if (chunk.code.indexOf(preloadMarker) > -1) {
          const rewroteMarkerStartPos = new Set() // position of the leading double quote

          if (format === 'es') {
            let imports!: ImportSpecifier[]
            try {
              imports = parseImports(code)[0].filter((i) => i.d > -1)
            } catch (e: any) {
              this.error(e, e.idx)
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

                  createAddDepsFunc(deps, chunk.fileName, (chunk) => {
                    if (chunk.viteMetadata!.importedCss.size) {
                      hasRemovedPureCssChunk = true
                    }
                    s.update(expStart, expEnd, 'Promise.resolve({})')
                  })(normalizedFile)
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
                      ? [...deps]
                      : []

                  const renderedDeps = calcRenderedDeps(
                    normalizedFile,
                    depsArray,
                    file,
                    chunk,
                  )

                  s.update(
                    markerStartPos,
                    markerStartPos + preloadMarker.length + 2,
                    `[${renderedDeps.join(',')}]`,
                  )
                  rewroteMarkerStartPos.add(markerStartPos)
                }
              }
            }
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
        }

        if (s.hasChanged()) {
          chunk.code = s.toString()
          if (config.build.sourcemap && chunk.map) {
            const nextMap = s.generateMap({
              source: chunk.fileName,
              hires: true,
            })
            const map = combineSourcemaps(
              chunk.fileName,
              [nextMap as RawSourceMap, chunk.map as RawSourceMap],
              false,
            ) as SourceMap
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
    },
  }
}
