import path from 'node:path'
import MagicString from 'magic-string'
import type {
  ParseError as EsModuleLexerParseError,
  ImportSpecifier,
} from 'es-module-lexer'
import { init, parse as parseImports } from 'es-module-lexer'
import type { SourceMap } from 'rollup'
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
import type { Environment } from '../environment'
import { removedPureCssFilesCache } from './css'
import { createParseErrorInfo } from './importAnalysis'

type FileDep = {
  url: string
  runtime: boolean
}

type VitePreloadErrorEvent = Event & { payload: Error }

// Placeholder symbols for injecting helpers
export const isEsmFlag = `__VITE_IS_MODERN__`
export const preloadMethod = `__vitePreload`
const preloadMarker = `__VITE_PRELOAD__`
const viteMapDeps = '__vite__mapDeps'

export const preloadHelperId = '\0vite/preload-helper.js'
const preloadMarkerRE = new RegExp('\\b' + preloadMarker + '\\b', 'g')

const dynamicImportPrefixRE = /import\s*\(/

const dynamicImportTreeshakenRE =
  /((?:\bconst\s+|\blet\s+|\bvar\s+|,\s*)(\{[^{}.=]+\})\s*=\s*await\s+import\([^)]+\))|(\(\s*await\s+import\([^)]+\)\s*\)(\??\.[\w$]+))|\bimport\([^)]+\)(\s*\.then\(\s*(?:function\s*)?\(\s*\{([^{}.=]+)\}\))/g

function toRelativePath(filename: string, importer: string) {
  const relPath = path.posix.relative(path.posix.dirname(importer), filename)
  return relPath[0] === '.' ? relPath : `./${relPath}`
}

function indexOfRegexp(str: string, reg: RegExp, pos: number = 0) {
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
  baseModule: () => Promise<unknown>,
  deps?: string[],
  importerUrl?: string,
) {
  let promise: Promise<PromiseSettledResult<unknown>[] | void> =
    Promise.resolve()
  if (
    // @ts-expect-error __VITE_IS_MODERN__ will be replaced with boolean later
    __VITE_IS_MODERN__ &&
    deps &&
    deps.length > 0
  ) {
    const links = document.getElementsByTagName('link')
    const cspNonceMeta = document.querySelector<HTMLMetaElement>(
      'meta[property=csp-nonce]',
    )
    // `.nonce` should be used to get along with nonce hiding (https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce#accessing_nonces_and_nonce_hiding)
    // Firefox 67-74 uses modern chunks and supports CSP nonce, but does not support `.nonce`
    // in that case fallback to getAttribute
    const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute('nonce')

    promise = Promise.allSettled(
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
        }
        link.crossOrigin = ''
        link.href = dep
        if (cspNonce) {
          link.setAttribute('nonce', cspNonce)
        }
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

  function handlePreloadError(err: Error) {
    const e = new Event('vite:preloadError', {
      cancelable: true,
    }) as VitePreloadErrorEvent
    e.payload = err
    window.dispatchEvent(e)
    if (!e.defaultPrevented) {
      throw err
    }
  }

  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== 'rejected') continue
      handlePreloadError(item.reason)
    }
    return baseModule().catch(handlePreloadError)
  })
}

/**
 * Build only. During serve this is performed as part of ./importAnalysis.
 */
export function buildImportAnalysisPlugin(config: ResolvedConfig): Plugin {
  const shouldInsertPreload = (environment: Environment) =>
    environment.config.consumer === 'client' &&
    !config.isWorker &&
    !config.build.lib

  const renderBuiltUrl = config.experimental.renderBuiltUrl
  const isRelativeBase = config.base === './' || config.base === ''

  return {
    name: 'vite:build-import-analysis',
    resolveId: {
      handler(id) {
        if (id === preloadHelperId) {
          return id
        }
      },
    },

    load: {
      handler(id) {
        if (id === preloadHelperId) {
          const { modulePreload } = this.environment.config.build

          const scriptRel =
            modulePreload && modulePreload.polyfill
              ? `'modulepreload'`
              : `/* @__PURE__ */ (${detectScriptRel.toString()})()`

          // There are two different cases for the preload list format in __vitePreload
          //
          // __vitePreload(() => import(asyncChunk), [ ...deps... ])
          //
          // This is maintained to keep backwards compatibility as some users developed plugins
          // using regex over this list to workaround the fact that module preload wasn't
          // configurable.
          const assetsURL =
            renderBuiltUrl || isRelativeBase
              ? // If `experimental.renderBuiltUrl` is used, the dependencies might be relative to the current chunk.
                // If relative base is used, the dependencies are relative to the current chunk.
                // The importerUrl is passed as third parameter to __vitePreload in this case
                `(dep, importerUrl) => new URL(dep, importerUrl).href`
              : // If the base isn't relative, then the deps are relative to the projects `outDir` and the base
                // is appended inside __vitePreload too.
                `(dep) => ${JSON.stringify(config.base)}+dep`
          const code = [
            `const scriptRel = ${scriptRel}`,
            `const assetsURL = ${assetsURL}`,
            `const seen = {}`,
            `export const ${preloadMethod} = ${preload.toString()}`,
          ].join(';')

          return {
            code,
            moduleSideEffects: false,
          }
        }
      },
    },

    transform: {
      async handler(source, importer) {
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

        if (imports.length === 0) {
          return null
        }

        const willInsertPreload = shouldInsertPreload(this.environment)
        // when wrapping dynamic imports with a preload helper, Rollup is unable to analyze the
        // accessed variables for treeshaking. This below tries to match common accessed syntax
        // to "copy" it over to the dynamic import wrapped by the preload helper.
        const dynamicImports: Record<
          number,
          { declaration?: string; names?: string }
        > = {}

        if (willInsertPreload) {
          let match
          while ((match = dynamicImportTreeshakenRE.exec(source))) {
            /* handle `const {foo} = await import('foo')`
             *
             * match[1]: `const {foo} = await import('foo')`
             * match[2]: `{foo}`
             * import end: `const {foo} = await import('foo')_`
             *                                               ^
             */
            if (match[1]) {
              dynamicImports[dynamicImportTreeshakenRE.lastIndex] = {
                declaration: `const ${match[2]}`,
                names: match[2]?.trim(),
              }
              continue
            }

            /* handle `(await import('foo')).foo`
             *
             * match[3]: `(await import('foo')).foo`
             * match[4]: `.foo`
             * import end: `(await import('foo'))`
             *                                  ^
             */
            if (match[3]) {
              let names = /\.([^.?]+)/.exec(match[4])?.[1] || ''
              // avoid `default` keyword error
              if (names === 'default') {
                names = 'default: __vite_default__'
              }
              dynamicImports[
                dynamicImportTreeshakenRE.lastIndex - match[4]?.length - 1
              ] = { declaration: `const {${names}}`, names: `{ ${names} }` }
              continue
            }

            /* handle `import('foo').then(({foo})=>{})`
             *
             * match[5]: `.then(({foo})`
             * match[6]: `foo`
             * import end: `import('foo').`
             *                           ^
             */
            const names = match[6]?.trim()
            dynamicImports[
              dynamicImportTreeshakenRE.lastIndex - match[5]?.length
            ] = { declaration: `const {${names}}`, names: `{ ${names} }` }
          }
        }

        const s = new MagicString(source)
        let needPreloadHelper = false

        for (const imp of imports) {
          const { s: start, e: end, ss: expStart, se: expEnd } = imp

          const isDynamicImport = imp.d > -1
          const hasAttributes = imp.a > -1

          // strip import attributes as we process them ourselves
          if (!isDynamicImport && hasAttributes) {
            s.remove(end + 1, expEnd)
          }

          if (
            isDynamicImport &&
            willInsertPreload &&
            // Only preload static urls
            (source[start] === '"' ||
              source[start] === "'" ||
              source[start] === '`')
          ) {
            needPreloadHelper = true
            const { declaration, names } = dynamicImports[expEnd] || {}
            if (names) {
              /* transform `const {foo} = await import('foo')`
               * to `const {foo} = await __vitePreload(async () => { const {foo} = await import('foo');return {foo}}, ...)`
               *
               * transform `import('foo').then(({foo})=>{})`
               * to `__vitePreload(async () => { const {foo} = await import('foo');return { foo }},...).then(({foo})=>{})`
               *
               * transform `(await import('foo')).foo`
               * to `__vitePreload(async () => { const {foo} = (await import('foo')).foo; return { foo }},...)).foo`
               */
              s.prependLeft(
                expStart,
                `${preloadMethod}(async () => { ${declaration} = await `,
              )
              s.appendRight(expEnd, `;return ${names}}`)
            } else {
              s.prependLeft(expStart, `${preloadMethod}(() => `)
            }

            s.appendRight(
              expEnd,
              `,${isEsmFlag}?${preloadMarker}:void 0${
                renderBuiltUrl || isRelativeBase ? ',import.meta.url' : ''
              })`,
            )
          }
        }

        if (
          needPreloadHelper &&
          willInsertPreload &&
          !source.includes(`const ${preloadMethod} =`)
        ) {
          s.prepend(`import { ${preloadMethod} } from "${preloadHelperId}";`)
        }

        if (s.hasChanged()) {
          return {
            code: s.toString(),
            map: this.environment.config.build.sourcemap
              ? s.generateMap({ hires: 'boundary' })
              : null,
          }
        }
      },
    },

    renderChunk(code, _, { format }) {
      // make sure we only perform the preload logic in modern builds.
      if (!code.includes(isEsmFlag)) {
        return
      }

      const re = new RegExp(isEsmFlag, 'g')
      const isEsm = String(format === 'es')
      if (!this.environment.config.build.sourcemap) {
        return code.replace(re, isEsm)
      }

      const s = new MagicString(code)
      let match: RegExpExecArray | null
      while ((match = re.exec(code))) {
        s.update(match.index, match.index + isEsmFlag.length, isEsm)
      }
      return {
        code: s.toString(),
        map: s.generateMap({ hires: 'boundary' }),
      }
    },

    generateBundle({ format }, bundle) {
      if (format !== 'es') {
        return
      }

      // If preload is not enabled, we parse through each imports and remove any imports to pure CSS chunks
      // as they are removed from the bundle
      if (!shouldInsertPreload(this.environment)) {
        const removedPureCssFiles = removedPureCssFilesCache.get(config)
        if (removedPureCssFiles && removedPureCssFiles.size > 0) {
          for (const file in bundle) {
            const chunk = bundle[file]
            if (chunk.type === 'chunk' && chunk.code.includes('import')) {
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

              for (const imp of imports) {
                const {
                  n: name,
                  s: start,
                  e: end,
                  ss: expStart,
                  se: expEnd,
                } = imp
                let url = name
                if (!url) {
                  const rawUrl = code.slice(start, end)
                  if (rawUrl[0] === `"` && rawUrl.endsWith(`"`))
                    url = rawUrl.slice(1, -1)
                }
                if (!url) continue

                const normalizedFile = path.posix.join(
                  path.posix.dirname(chunk.fileName),
                  url,
                )
                if (removedPureCssFiles.has(normalizedFile)) {
                  // remove with Promise.resolve({}) while preserving source map location
                  chunk.code =
                    chunk.code.slice(0, expStart) +
                    `Promise.resolve({${''.padEnd(expEnd - expStart - 19, ' ')}})` +
                    chunk.code.slice(expEnd)
                }
              }
            }
          }
        }
        return
      }
      const buildSourcemap = this.environment.config.build.sourcemap
      const { modulePreload } = this.environment.config.build

      for (const chunkName in bundle) {
        const chunk = bundle[chunkName]
        if (chunk.type !== 'chunk') {
          continue
        }

        const { code, fileName: parentChunkName } = chunk

        // can't use chunk.dynamicImports.length here since some modules e.g.
        // dynamic import to constant json may get inlined.
        if (!code.includes(preloadMarker)) {
          continue
        }

        let dynamicImports!: ImportSpecifier[]
        try {
          dynamicImports = parseImports(code)[0].filter((i) => i.d > -1)
        } catch (e: any) {
          const loc = numberToPos(code, e.idx)
          this.error({
            name: e.name,
            message: e.message,
            stack: e.stack,
            cause: e.cause,
            pos: e.idx,
            loc: {
              ...loc,
              file: parentChunkName,
            },
            frame: generateCodeFrame(code, loc),
          })
        }

        const s = new MagicString(code)
        const rewroteMarkerStartPos = new Set() // position of the leading double quote

        const chunkRegistry: FileDep[] = []
        const getChunkId = (url: string, runtime: boolean = false) => {
          const index = chunkRegistry.findIndex((dep) => dep.url === url)
          if (index === -1) {
            return chunkRegistry.push({ url, runtime }) - 1
          }
          return index
        }

        for (const dynamicImport of dynamicImports) {
          // To handle escape sequences in specifier strings, the .n field will be provided where possible.
          const { s: start, e: end, ss: expStart, se: expEnd } = dynamicImport

          // check the chunk being imported
          let importUrl = dynamicImport.n
          if (!importUrl) {
            const rawUrl = code.slice(start, end)
            if (rawUrl[0] === `"` && rawUrl.endsWith(`"`))
              importUrl = rawUrl.slice(1, -1)
          }

          const dependencies = new Set<string>()
          let hasRemovedPureCssChunk = false

          let importUrlResolved: string | undefined = undefined

          if (importUrl) {
            importUrlResolved = path.posix.join(
              path.posix.dirname(parentChunkName),
              importUrl,
            )

            // literal import - trace direct imports and add to deps
            const traversed = new Set<string>()
            ;(function traverseChunkDependencies(chunkName: string) {
              if (chunkName === parentChunkName) return
              if (traversed.has(chunkName)) return
              traversed.add(chunkName)
              const chunk = bundle[chunkName]
              if (chunk) {
                dependencies.add(chunk.fileName)
                if (chunk.type === 'chunk') {
                  chunk.imports.forEach(traverseChunkDependencies)
                  // Ensure that the css imported by current chunk is loaded after the dependencies.
                  // So the style of current chunk won't be overwritten unexpectedly.
                  chunk.viteMetadata!.importedCss.forEach((file) =>
                    dependencies.add(file),
                  )
                }
              } else {
                const removedPureCssFiles =
                  removedPureCssFilesCache.get(config)!
                const chunk = removedPureCssFiles.get(chunkName)
                if (chunk) {
                  if (chunk.viteMetadata!.importedCss.size) {
                    chunk.viteMetadata!.importedCss.forEach((file) =>
                      dependencies.add(file),
                    )
                    hasRemovedPureCssChunk = true
                  }

                  s.update(expStart, expEnd, 'Promise.resolve({})')
                }
              }
            })(importUrlResolved)
          }

          let markerStartPos = indexOfRegexp(code, preloadMarkerRE, end)
          // fix issue #3051
          if (markerStartPos === -1 && dynamicImports.length === 1) {
            markerStartPos = indexOfRegexp(code, preloadMarkerRE)
          }

          if (markerStartPos > 0) {
            // the dep list includes the main chunk, so only need to reload when there are actual other deps.
            let depsArray =
              dependencies.size > 1 ||
              // main chunk is removed
              (hasRemovedPureCssChunk && dependencies.size > 0)
                ? modulePreload === false
                  ? // CSS deps use the same mechanism as module preloads, so even if disabled,
                    // we still need to pass these deps to the preload helper in dynamic imports.
                    [...dependencies].filter((d) => d.endsWith('.css'))
                  : [...dependencies]
                : []

            const resolveDependencies = modulePreload
              ? modulePreload.resolveDependencies
              : undefined
            if (resolveDependencies && importUrlResolved) {
              // We can't let the user remove css deps as these aren't really preloads, they are just using
              // the same mechanism as module preloads for this chunk
              const cssDeps: string[] = []
              const otherDeps: string[] = []
              for (const dep of depsArray) {
                ;(dep.endsWith('.css') ? cssDeps : otherDeps).push(dep)
              }
              depsArray = [
                ...resolveDependencies(importUrlResolved, otherDeps, {
                  hostId: chunkName,
                  hostType: 'js',
                }),
                ...cssDeps,
              ]
            }

            let chunkDependencies: number[]
            if (renderBuiltUrl) {
              chunkDependencies = depsArray.map((dep) => {
                const replacement = toOutputFilePathInJS(
                  this.environment,
                  dep,
                  'asset',
                  chunk.fileName,
                  'js',
                  toRelativePath,
                )

                if (typeof replacement === 'string') {
                  return getChunkId(replacement)
                }

                return getChunkId(replacement.runtime, true)
              })
            } else {
              chunkDependencies = depsArray.map((d) =>
                // Don't include the assets dir if the default asset file names
                // are used, the path will be reconstructed by the import preload helper
                isRelativeBase
                  ? getChunkId(toRelativePath(d, chunkName))
                  : getChunkId(d),
              )
            }

            s.update(
              markerStartPos,
              markerStartPos + preloadMarker.length,
              chunkDependencies.length > 0
                ? `${viteMapDeps}([${chunkDependencies.join(',')}])`
                : `[]`,
            )
            rewroteMarkerStartPos.add(markerStartPos)
          }
        }

        if (chunkRegistry.length > 0) {
          const chunkRegistryCode = `[${chunkRegistry
            .map((fileDep) =>
              fileDep.runtime ? fileDep.url : JSON.stringify(fileDep.url),
            )
            .join(',')}]`

          const mapDepsCode = `const ${viteMapDeps}=(i,m=${viteMapDeps},d=(m.f||(m.f=${chunkRegistryCode})))=>i.map(i=>d[i]);\n`

          // inject extra code at the top or next line of hashbang
          if (code.startsWith('#!')) {
            s.prependLeft(code.indexOf('\n') + 1, mapDepsCode)
          } else {
            s.prepend(mapDepsCode)
          }
        }

        // there may still be markers due to inlined dynamic imports, remove
        // all the markers regardless
        let markerStartPos = indexOfRegexp(code, preloadMarkerRE)
        while (markerStartPos >= 0) {
          if (!rewroteMarkerStartPos.has(markerStartPos)) {
            s.update(
              markerStartPos,
              markerStartPos + preloadMarker.length,
              'void 0',
            )
          }
          markerStartPos = indexOfRegexp(
            code,
            preloadMarkerRE,
            markerStartPos + preloadMarker.length,
          )
        }

        if (!s.hasChanged()) {
          continue
        }

        chunk.code = s.toString()

        if (!buildSourcemap || !chunk.map) {
          continue
        }

        const nextMap = s.generateMap({
          source: chunk.fileName,
          hires: 'boundary',
        })
        const map = combineSourcemaps(chunk.fileName, [
          nextMap as RawSourceMap,
          chunk.map as RawSourceMap,
        ]) as SourceMap
        map.toUrl = () => genSourceMapUrl(map)

        const originalDebugId = chunk.map.debugId
        chunk.map = map

        if (buildSourcemap === 'inline') {
          chunk.code = chunk.code.replace(
            convertSourceMap.mapFileCommentRegex,
            '',
          )
          chunk.code += `\n//# sourceMappingURL=${genSourceMapUrl(map)}`
        } else {
          if (originalDebugId) {
            map.debugId = originalDebugId
          }
          const mapAsset = bundle[chunk.fileName + '.map']
          if (mapAsset && mapAsset.type === 'asset') {
            mapAsset.source = map.toString()
          }
        }
      }
    },
  }
}
