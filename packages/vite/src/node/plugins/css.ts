import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import glob from 'fast-glob'
import postcssrc from 'postcss-load-config'
import type {
  ExistingRawSourceMap,
  OutputChunk,
  RenderedChunk,
  RollupError,
  SourceMapInput,
} from 'rollup'
import { dataToEsm } from '@rollup/pluginutils'
import colors from 'picocolors'
import MagicString from 'magic-string'
import type * as PostCSS from 'postcss'
import type Sass from 'sass'
import type Stylus from 'stylus'
import type Less from 'less'
import type { Alias } from 'dep-types/alias'
import type { LightningCSSOptions } from 'dep-types/lightningcss'
import type { TransformOptions } from 'esbuild'
import { formatMessages, transform } from 'esbuild'
import type { RawSourceMap } from '@ampproject/remapping'
import { getCodeWithSourcemap, injectSourcesContent } from '../server/sourcemap'
import type { ModuleNode } from '../server/moduleGraph'
import type { ResolveFn, ViteDevServer } from '../'
import { resolveUserExternal, toOutputFilePathInCss } from '../build'
import {
  CLIENT_PUBLIC_PATH,
  CSS_LANGS_RE,
  ESBUILD_MODULES_TARGET,
  SPECIAL_QUERY_RE,
} from '../constants'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import {
  arraify,
  asyncReplace,
  cleanUrl,
  combineSourcemaps,
  emptyCssComments,
  generateCodeFrame,
  getHash,
  getPackageManagerCommand,
  isDataUrl,
  isExternalUrl,
  isObject,
  joinUrlSegments,
  normalizePath,
  parseRequest,
  processSrcSet,
  removeDirectQuery,
  requireResolveFromRootWithFallback,
  stripBase,
  stripBomTag,
} from '../utils'
import type { Logger } from '../logger'
import { addToHTMLProxyTransformResult } from './html'
import {
  assetUrlRE,
  checkPublicFile,
  fileToUrl,
  generatedAssets,
  publicAssetUrlCache,
  publicAssetUrlRE,
  publicFileToBuiltUrl,
  renderAssetUrlInJS,
} from './asset'
import type { ESBuildOptions } from './esbuild'

// const debug = createDebugger('vite:css')

export interface CSSOptions {
  /**
   * Using lightningcss is an experimental option to handle CSS modules,
   * assets and imports via Lightning CSS. It requires to install it as a
   * peer dependency. This is incompatible with the use of preprocessors.
   *
   * @default 'postcss'
   * @experimental
   */
  transformer?: 'postcss' | 'lightningcss'
  /**
   * https://github.com/css-modules/postcss-modules
   */
  modules?: CSSModulesOptions | false
  preprocessorOptions?: Record<string, any>
  postcss?:
    | string
    | (PostCSS.ProcessOptions & {
        plugins?: PostCSS.AcceptedPlugin[]
      })
  /**
   * Enables css sourcemaps during dev
   * @default false
   * @experimental
   */
  devSourcemap?: boolean

  /**
   * @experimental
   */
  lightningcss?: LightningCSSOptions
}

export interface CSSModulesOptions {
  getJSON?: (
    cssFileName: string,
    json: Record<string, string>,
    outputFileName: string,
  ) => void
  scopeBehaviour?: 'global' | 'local'
  globalModulePaths?: RegExp[]
  generateScopedName?:
    | string
    | ((name: string, filename: string, css: string) => string)
  hashPrefix?: string
  /**
   * default: undefined
   */
  localsConvention?:
    | 'camelCase'
    | 'camelCaseOnly'
    | 'dashes'
    | 'dashesOnly'
    | ((
        originalClassName: string,
        generatedClassName: string,
        inputFile: string,
      ) => string)
}

export type ResolvedCSSOptions = Omit<CSSOptions, 'lightningcss'> & {
  lightningcss?: LightningCSSOptions & {
    targets: LightningCSSOptions['targets']
  }
}

export function resolveCSSOptions(
  options: CSSOptions | undefined,
): ResolvedCSSOptions | undefined {
  if (options?.lightningcss) {
    return {
      ...options,
      lightningcss: {
        ...options.lightningcss,
        targets:
          options.lightningcss.targets ??
          convertTargets(ESBUILD_MODULES_TARGET),
      },
    }
  }
  // TS doesn't narrow the type with the previous if :/
  return options as Omit<CSSOptions, 'lightningcss'>
}

const cssModuleRE = new RegExp(`\\.module${CSS_LANGS_RE.source}`)
const directRequestRE = /[?&]direct\b/
const htmlProxyRE = /[?&]html-proxy\b/
const commonjsProxyRE = /\?commonjs-proxy/
const inlineRE = /[?&]inline\b/
const inlineCSSRE = /[?&]inline-css\b/
const styleAttrRE = /[?&]style-attr\b/
const varRE = /^var\(/i

const cssBundleName = 'style.css'

const enum PreprocessLang {
  less = 'less',
  sass = 'sass',
  scss = 'scss',
  styl = 'styl',
  stylus = 'stylus',
}
const enum PureCssLang {
  css = 'css',
}
const enum PostCssDialectLang {
  sss = 'sugarss',
}
type CssLang =
  | keyof typeof PureCssLang
  | keyof typeof PreprocessLang
  | keyof typeof PostCssDialectLang

export const isCSSRequest = (request: string): boolean =>
  CSS_LANGS_RE.test(request)

export const isModuleCSSRequest = (request: string): boolean =>
  cssModuleRE.test(request)

export const isDirectCSSRequest = (request: string): boolean =>
  CSS_LANGS_RE.test(request) && directRequestRE.test(request)

export const isDirectRequest = (request: string): boolean =>
  directRequestRE.test(request)

const cssModulesCache = new WeakMap<
  ResolvedConfig,
  Map<string, Record<string, string>>
>()

export const removedPureCssFilesCache = new WeakMap<
  ResolvedConfig,
  Map<string, RenderedChunk>
>()

const postcssConfigCache = new WeakMap<
  ResolvedConfig,
  PostCSSConfigResult | null | Promise<PostCSSConfigResult | null>
>()

function encodePublicUrlsInCSS(config: ResolvedConfig) {
  return config.command === 'build'
}

/**
 * Plugin applied before user plugins
 */
export function cssPlugin(config: ResolvedConfig): Plugin {
  let server: ViteDevServer
  let moduleCache: Map<string, Record<string, string>>

  const resolveUrl = config.createResolver({
    preferRelative: true,
    tryIndex: false,
    extensions: [],
  })

  // warm up cache for resolved postcss config
  if (config.css?.transformer !== 'lightningcss') {
    resolvePostcssConfig(config)
  }

  return {
    name: 'vite:css',

    configureServer(_server) {
      server = _server
    },

    buildStart() {
      // Ensure a new cache for every build (i.e. rebuilding in watch mode)
      moduleCache = new Map<string, Record<string, string>>()
      cssModulesCache.set(config, moduleCache)

      removedPureCssFilesCache.set(config, new Map<string, RenderedChunk>())
    },

    async transform(raw, id, options) {
      if (
        !isCSSRequest(id) ||
        commonjsProxyRE.test(id) ||
        SPECIAL_QUERY_RE.test(id)
      ) {
        return
      }
      const ssr = options?.ssr === true

      const urlReplacer: CssUrlReplacer = async (url, importer) => {
        if (checkPublicFile(url, config)) {
          if (encodePublicUrlsInCSS(config)) {
            return publicFileToBuiltUrl(url, config)
          } else {
            return joinUrlSegments(config.base, url)
          }
        }
        const resolved = await resolveUrl(url, importer)
        if (resolved) {
          return fileToUrl(resolved, config, this)
        }
        if (config.command === 'build') {
          const isExternal = config.build.rollupOptions.external
            ? resolveUserExternal(
                config.build.rollupOptions.external,
                url, // use URL as id since id could not be resolved
                id,
                false,
              )
            : false

          if (!isExternal) {
            // #9800 If we cannot resolve the css url, leave a warning.
            config.logger.warnOnce(
              `\n${url} referenced in ${id} didn't resolve at build time, it will remain unchanged to be resolved at runtime`,
            )
          }
        }
        return url
      }

      const {
        code: css,
        modules,
        deps,
        map,
      } = await compileCSS(id, raw, config, urlReplacer)
      if (modules) {
        moduleCache.set(id, modules)
      }

      // track deps for build watch mode
      if (config.command === 'build' && config.build.watch && deps) {
        for (const file of deps) {
          this.addWatchFile(file)
        }
      }

      // dev
      if (server) {
        // server only logic for handling CSS @import dependency hmr
        const { moduleGraph } = server
        const thisModule = moduleGraph.getModuleById(id)
        if (thisModule) {
          // CSS modules cannot self-accept since it exports values
          const isSelfAccepting =
            !modules && !inlineRE.test(id) && !htmlProxyRE.test(id)
          if (deps) {
            // record deps in the module graph so edits to @import css can trigger
            // main import to hot update
            const depModules = new Set<string | ModuleNode>()
            const devBase = config.base
            for (const file of deps) {
              depModules.add(
                isCSSRequest(file)
                  ? moduleGraph.createFileOnlyEntry(file)
                  : await moduleGraph.ensureEntryFromUrl(
                      stripBase(
                        await fileToUrl(file, config, this),
                        (config.server?.origin ?? '') + devBase,
                      ),
                      ssr,
                    ),
              )
            }
            moduleGraph.updateModuleInfo(
              thisModule,
              depModules,
              null,
              // The root CSS proxy module is self-accepting and should not
              // have an explicit accept list
              new Set(),
              null,
              isSelfAccepting,
              ssr,
            )
            for (const file of deps) {
              this.addWatchFile(file)
            }
          } else {
            thisModule.isSelfAccepting = isSelfAccepting
          }
        }
      }

      return {
        code: css,
        map,
      }
    },
  }
}

/**
 * Plugin applied after user plugins
 */
export function cssPostPlugin(config: ResolvedConfig): Plugin {
  // styles initialization in buildStart causes a styling loss in watch
  const styles: Map<string, string> = new Map<string, string>()
  // list of css emit tasks to guarantee the files are emitted in a deterministic order
  let emitTasks: Promise<void>[] = []
  let pureCssChunks: Set<RenderedChunk>

  // when there are multiple rollup outputs and extracting CSS, only emit once,
  // since output formats have no effect on the generated CSS.
  let hasEmitted = false
  let chunkCSSMap: Map<string, string>

  const rollupOptionsOutput = config.build.rollupOptions.output
  const assetFileNames = (
    Array.isArray(rollupOptionsOutput)
      ? rollupOptionsOutput[0]
      : rollupOptionsOutput
  )?.assetFileNames
  const getCssAssetDirname = (cssAssetName: string) => {
    if (!assetFileNames) {
      return config.build.assetsDir
    } else if (typeof assetFileNames === 'string') {
      return path.dirname(assetFileNames)
    } else {
      return path.dirname(
        assetFileNames({
          name: cssAssetName,
          type: 'asset',
          source: '/* vite internal call, ignore */',
        }),
      )
    }
  }

  return {
    name: 'vite:css-post',

    renderStart() {
      // Ensure new caches for every build (i.e. rebuilding in watch mode)
      pureCssChunks = new Set<RenderedChunk>()
      hasEmitted = false
      chunkCSSMap = new Map()
      emitTasks = []
    },

    async transform(css, id, options) {
      if (
        !isCSSRequest(id) ||
        commonjsProxyRE.test(id) ||
        SPECIAL_QUERY_RE.test(id)
      ) {
        return
      }

      css = stripBomTag(css)

      const inlined = inlineRE.test(id)
      const modules = cssModulesCache.get(config)!.get(id)

      // #6984, #7552
      // `foo.module.css` => modulesCode
      // `foo.module.css?inline` => cssContent
      const modulesCode =
        modules &&
        !inlined &&
        dataToEsm(modules, { namedExports: true, preferConst: true })

      if (config.command === 'serve') {
        const getContentWithSourcemap = async (content: string) => {
          if (config.css?.devSourcemap) {
            const sourcemap = this.getCombinedSourcemap()
            if (sourcemap.mappings) {
              await injectSourcesContent(sourcemap, cleanUrl(id), config.logger)
            }
            return getCodeWithSourcemap('css', content, sourcemap)
          }
          return content
        }

        if (isDirectCSSRequest(id)) {
          return null
        }
        // server only
        if (options?.ssr) {
          return modulesCode || `export default ${JSON.stringify(css)}`
        }
        if (inlined) {
          return `export default ${JSON.stringify(css)}`
        }

        const cssContent = await getContentWithSourcemap(css)
        const code = [
          `import { updateStyle as __vite__updateStyle, removeStyle as __vite__removeStyle } from ${JSON.stringify(
            path.posix.join(config.base, CLIENT_PUBLIC_PATH),
          )}`,
          `const __vite__id = ${JSON.stringify(id)}`,
          `const __vite__css = ${JSON.stringify(cssContent)}`,
          `__vite__updateStyle(__vite__id, __vite__css)`,
          // css modules exports change on edit so it can't self accept
          `${modulesCode || 'import.meta.hot.accept()'}`,
          `import.meta.hot.prune(() => __vite__removeStyle(__vite__id))`,
        ].join('\n')
        return { code, map: { mappings: '' } }
      }

      // build CSS handling ----------------------------------------------------

      // record css
      // cache css compile result to map
      // and then use the cache replace inline-style-flag when `generateBundle` in vite:build-html plugin
      const inlineCSS = inlineCSSRE.test(id)
      const isHTMLProxy = htmlProxyRE.test(id)
      const query = parseRequest(id)
      if (inlineCSS && isHTMLProxy) {
        if (styleAttrRE.test(id)) {
          css = css.replace(/"/g, '&quot;')
        }
        addToHTMLProxyTransformResult(
          `${getHash(cleanUrl(id))}_${Number.parseInt(query!.index)}`,
          css,
        )
        return `export default ''`
      }
      if (!inlined) {
        styles.set(id, css)
      }

      let code: string
      if (modulesCode) {
        code = modulesCode
      } else if (inlined) {
        let content = css
        if (config.build.cssMinify) {
          content = await minifyCSS(content, config, true)
        }
        code = `export default ${JSON.stringify(content)}`
      } else {
        // empty module when it's not a CSS module nor `?inline`
        code = ''
      }

      return {
        code,
        map: { mappings: '' },
        // avoid the css module from being tree-shaken so that we can retrieve
        // it in renderChunk()
        moduleSideEffects: inlined ? false : 'no-treeshake',
      }
    },

    async renderChunk(code, chunk, opts) {
      let chunkCSS = ''
      let isPureCssChunk = true
      const ids = Object.keys(chunk.modules)
      for (const id of ids) {
        if (styles.has(id)) {
          chunkCSS += styles.get(id)
          // a css module contains JS, so it makes this not a pure css chunk
          if (cssModuleRE.test(id)) {
            isPureCssChunk = false
          }
        } else {
          // if the module does not have a style, then it's not a pure css chunk.
          // this is true because in the `transform` hook above, only modules
          // that are css gets added to the `styles` map.
          isPureCssChunk = false
        }
      }

      if (!chunkCSS) {
        return null
      }

      const publicAssetUrlMap = publicAssetUrlCache.get(config)!

      // resolve asset URL placeholders to their built file URLs
      const resolveAssetUrlsInCss = (
        chunkCSS: string,
        cssAssetName: string,
      ) => {
        const encodedPublicUrls = encodePublicUrlsInCSS(config)

        const relative = config.base === './' || config.base === ''
        const cssAssetDirname =
          encodedPublicUrls || relative
            ? getCssAssetDirname(cssAssetName)
            : undefined

        const toRelative = (filename: string) => {
          // relative base + extracted CSS
          const relativePath = path.posix.relative(cssAssetDirname!, filename)
          return relativePath[0] === '.' ? relativePath : './' + relativePath
        }

        // replace asset url references with resolved url.
        chunkCSS = chunkCSS.replace(assetUrlRE, (_, fileHash, postfix = '') => {
          const filename = this.getFileName(fileHash) + postfix
          chunk.viteMetadata!.importedAssets.add(cleanUrl(filename))
          return toOutputFilePathInCss(
            filename,
            'asset',
            cssAssetName,
            'css',
            config,
            toRelative,
          )
        })
        // resolve public URL from CSS paths
        if (encodedPublicUrls) {
          const relativePathToPublicFromCSS = path.posix.relative(
            cssAssetDirname!,
            '',
          )
          chunkCSS = chunkCSS.replace(publicAssetUrlRE, (_, hash) => {
            const publicUrl = publicAssetUrlMap.get(hash)!.slice(1)
            return toOutputFilePathInCss(
              publicUrl,
              'public',
              cssAssetName,
              'css',
              config,
              () => `${relativePathToPublicFromCSS}/${publicUrl}`,
            )
          })
        }
        return chunkCSS
      }

      function ensureFileExt(name: string, ext: string) {
        return normalizePath(
          path.format({ ...path.parse(name), base: undefined, ext }),
        )
      }

      if (config.build.cssCodeSplit) {
        if (isPureCssChunk) {
          // this is a shared CSS-only chunk that is empty.
          pureCssChunks.add(chunk)
        }
        if (opts.format === 'es' || opts.format === 'cjs') {
          const isEntry = chunk.isEntry && isPureCssChunk
          const cssAssetName = normalizePath(
            !isEntry && chunk.facadeModuleId
              ? path.relative(config.root, chunk.facadeModuleId)
              : chunk.name,
          )

          const lang = path.extname(cssAssetName).slice(1)
          const cssFileName = ensureFileExt(cssAssetName, '.css')

          chunkCSS = resolveAssetUrlsInCss(chunkCSS, cssAssetName)

          const previousTask = emitTasks[emitTasks.length - 1]
          // finalizeCss is async which makes `emitFile` non-deterministic, so
          // we use a `.then` to wait for previous tasks before finishing this
          const thisTask = finalizeCss(chunkCSS, true, config).then((css) => {
            chunkCSS = css
            // make sure the previous task is also finished, this works recursively
            return previousTask
          })

          // push this task so the next task can wait for this one
          emitTasks.push(thisTask)
          const emitTasksLength = emitTasks.length

          // wait for this and previous tasks to finish
          await thisTask

          // emit corresponding css file
          const referenceId = this.emitFile({
            name: path.basename(cssFileName),
            type: 'asset',
            source: chunkCSS,
          })
          const originalName = isPreProcessor(lang) ? cssAssetName : cssFileName
          generatedAssets
            .get(config)!
            .set(referenceId, { originalName, isEntry })
          chunk.viteMetadata!.importedCss.add(this.getFileName(referenceId))

          if (emitTasksLength === emitTasks.length) {
            // this is the last task, clear `emitTasks` to free up memory
            emitTasks = []
          }
        } else if (!config.build.ssr) {
          // legacy build and inline css

          // Entry chunk CSS will be collected into `chunk.viteMetadata.importedCss`
          // and injected later by the `'vite:build-html'` plugin into the `index.html`
          // so it will be duplicated. (https://github.com/vitejs/vite/issues/2062#issuecomment-782388010)
          // But because entry chunk can be imported by dynamic import,
          // we shouldn't remove the inlined CSS. (#10285)

          chunkCSS = await finalizeCss(chunkCSS, true, config)
          let cssString = JSON.stringify(chunkCSS)
          cssString =
            renderAssetUrlInJS(
              this,
              config,
              chunk,
              opts,
              cssString,
            )?.toString() || cssString
          const style = `__vite_style__`
          const injectCode =
            `var ${style} = document.createElement('style');` +
            `${style}.textContent = ${cssString};` +
            `document.head.appendChild(${style});`
          let injectionPoint
          const wrapIdx = code.indexOf('System.register')
          if (wrapIdx >= 0) {
            const executeFnStart = code.indexOf('execute:', wrapIdx)
            injectionPoint = code.indexOf('{', executeFnStart) + 1
          } else {
            const insertMark = "'use strict';"
            injectionPoint = code.indexOf(insertMark) + insertMark.length
          }
          const s = new MagicString(code)
          s.appendRight(injectionPoint, injectCode)
          if (config.build.sourcemap) {
            // resolve public URL from CSS paths, we need to use absolute paths
            return {
              code: s.toString(),
              map: s.generateMap({ hires: 'boundary' }),
            }
          } else {
            return { code: s.toString() }
          }
        }
      } else {
        chunkCSS = resolveAssetUrlsInCss(chunkCSS, cssBundleName)
        // finalizeCss is called for the aggregated chunk in generateBundle

        chunkCSSMap.set(chunk.fileName, chunkCSS)
      }
      return null
    },

    augmentChunkHash(chunk) {
      if (chunk.viteMetadata?.importedCss.size) {
        let hash = ''
        for (const id of chunk.viteMetadata.importedCss) {
          hash += id
        }
        return hash
      }
    },

    async generateBundle(opts, bundle) {
      // @ts-expect-error asset emits are skipped in legacy bundle
      if (opts.__vite_skip_asset_emit__) {
        return
      }

      // remove empty css chunks and their imports
      if (pureCssChunks.size) {
        // map each pure css chunk (rendered chunk) to it's corresponding bundle
        // chunk. we check that by `preliminaryFileName` as they have different
        // `filename`s (rendered chunk has the !~{XXX}~ placeholder)
        const prelimaryNameToChunkMap = Object.fromEntries(
          Object.values(bundle)
            .filter((chunk): chunk is OutputChunk => chunk.type === 'chunk')
            .map((chunk) => [chunk.preliminaryFileName, chunk.fileName]),
        )

        const pureCssChunkNames = [...pureCssChunks].map(
          (pureCssChunk) => prelimaryNameToChunkMap[pureCssChunk.fileName],
        )

        const emptyChunkFiles = pureCssChunkNames
          .map((file) => path.basename(file))
          .join('|')
          .replace(/\./g, '\\.')
        const emptyChunkRE = new RegExp(
          opts.format === 'es'
            ? `\\bimport\\s*["'][^"']*(?:${emptyChunkFiles})["'];\n?`
            : `\\brequire\\(\\s*["'][^"']*(?:${emptyChunkFiles})["']\\);\n?`,
          'g',
        )
        for (const file in bundle) {
          const chunk = bundle[file]
          if (chunk.type === 'chunk') {
            // remove pure css chunk from other chunk's imports,
            // and also register the emitted CSS files under the importer
            // chunks instead.
            chunk.imports = chunk.imports.filter((file) => {
              if (pureCssChunkNames.includes(file)) {
                const { importedCss, importedAssets } = (
                  bundle[file] as OutputChunk
                ).viteMetadata!
                importedCss.forEach((file) =>
                  chunk.viteMetadata!.importedCss.add(file),
                )
                importedAssets.forEach((file) =>
                  chunk.viteMetadata!.importedAssets.add(file),
                )
                return false
              }
              return true
            })
            chunk.code = chunk.code.replace(
              emptyChunkRE,
              // remove css import while preserving source map location
              (m) => `/* empty css ${''.padEnd(m.length - 15)}*/`,
            )
          }
        }
        const removedPureCssFiles = removedPureCssFilesCache.get(config)!
        pureCssChunkNames.forEach((fileName) => {
          removedPureCssFiles.set(fileName, bundle[fileName] as RenderedChunk)
          delete bundle[fileName]
          delete bundle[`${fileName}.map`]
        })
      }

      function extractCss() {
        let css = ''
        const collected = new Set<OutputChunk>()
        const prelimaryNameToChunkMap = new Map(
          Object.values(bundle)
            .filter((chunk): chunk is OutputChunk => chunk.type === 'chunk')
            .map((chunk) => [chunk.preliminaryFileName, chunk]),
        )

        function collect(fileName: string) {
          const chunk = bundle[fileName]
          if (!chunk || chunk.type !== 'chunk' || collected.has(chunk)) return
          collected.add(chunk)

          chunk.imports.forEach(collect)
          css += chunkCSSMap.get(chunk.preliminaryFileName) ?? ''
        }

        for (const chunkName of chunkCSSMap.keys())
          collect(prelimaryNameToChunkMap.get(chunkName)?.fileName ?? '')

        return css
      }
      let extractedCss = !hasEmitted && extractCss()
      if (extractedCss) {
        hasEmitted = true
        extractedCss = await finalizeCss(extractedCss, true, config)
        this.emitFile({
          name: cssBundleName,
          type: 'asset',
          source: extractedCss,
        })
      }
    },
  }
}

interface CSSAtImportResolvers {
  css: ResolveFn
  sass: ResolveFn
  less: ResolveFn
}

function createCSSResolvers(config: ResolvedConfig): CSSAtImportResolvers {
  let cssResolve: ResolveFn | undefined
  let sassResolve: ResolveFn | undefined
  let lessResolve: ResolveFn | undefined
  return {
    get css() {
      return (
        cssResolve ||
        (cssResolve = config.createResolver({
          extensions: ['.css'],
          mainFields: ['style'],
          conditions: ['style'],
          tryIndex: false,
          preferRelative: true,
        }))
      )
    },

    get sass() {
      return (
        sassResolve ||
        (sassResolve = config.createResolver({
          extensions: ['.scss', '.sass', '.css'],
          mainFields: ['sass', 'style'],
          conditions: ['sass', 'style'],
          tryIndex: true,
          tryPrefix: '_',
          preferRelative: true,
        }))
      )
    },

    get less() {
      return (
        lessResolve ||
        (lessResolve = config.createResolver({
          extensions: ['.less', '.css'],
          mainFields: ['less', 'style'],
          conditions: ['less', 'style'],
          tryIndex: false,
          preferRelative: true,
        }))
      )
    },
  }
}

function getCssResolversKeys(
  resolvers: CSSAtImportResolvers,
): Array<keyof CSSAtImportResolvers> {
  return Object.keys(resolvers) as unknown as Array<keyof CSSAtImportResolvers>
}

async function compileCSSPreprocessors(
  id: string,
  lang: PreprocessLang,
  code: string,
  config: ResolvedConfig,
): Promise<{ code: string; map?: ExistingRawSourceMap; deps?: Set<string> }> {
  const { preprocessorOptions, devSourcemap } = config.css ?? {}
  const atImportResolvers = getAtImportResolvers(config)

  const preProcessor = preProcessors[lang]
  let opts = (preprocessorOptions && preprocessorOptions[lang]) || {}
  // support @import from node dependencies by default
  switch (lang) {
    case PreprocessLang.scss:
    case PreprocessLang.sass:
      opts = {
        includePaths: ['node_modules'],
        alias: config.resolve.alias,
        ...opts,
      }
      break
    case PreprocessLang.less:
    case PreprocessLang.styl:
    case PreprocessLang.stylus:
      opts = {
        paths: ['node_modules'],
        alias: config.resolve.alias,
        ...opts,
      }
  }
  // important: set this for relative import resolving
  opts.filename = cleanUrl(id)
  opts.enableSourcemap = devSourcemap ?? false

  const preprocessResult = await preProcessor(
    code,
    config.root,
    opts,
    atImportResolvers,
  )
  if (preprocessResult.error) {
    throw preprocessResult.error
  }

  let deps: Set<string> | undefined
  if (preprocessResult.deps) {
    const normalizedFilename = normalizePath(opts.filename)
    // sometimes sass registers the file itself as a dep
    deps = new Set(
      [...preprocessResult.deps].filter(
        (dep) => normalizePath(dep) !== normalizedFilename,
      ),
    )
  }

  return {
    code: preprocessResult.code,
    map: combineSourcemapsIfExists(
      opts.filename,
      preprocessResult.map,
      preprocessResult.additionalMap,
    ),
    deps,
  }
}

const configToAtImportResolvers = new WeakMap<
  ResolvedConfig,
  CSSAtImportResolvers
>()
function getAtImportResolvers(config: ResolvedConfig) {
  let atImportResolvers = configToAtImportResolvers.get(config)
  if (!atImportResolvers) {
    atImportResolvers = createCSSResolvers(config)
    configToAtImportResolvers.set(config, atImportResolvers)
  }
  return atImportResolvers
}

async function compileCSS(
  id: string,
  code: string,
  config: ResolvedConfig,
  urlReplacer?: CssUrlReplacer,
): Promise<{
  code: string
  map?: SourceMapInput
  ast?: PostCSS.Result
  modules?: Record<string, string>
  deps?: Set<string>
}> {
  if (config.css?.transformer === 'lightningcss') {
    return compileLightningCSS(id, code, config, urlReplacer)
  }

  const { modules: modulesOptions, devSourcemap } = config.css || {}
  const isModule = modulesOptions !== false && cssModuleRE.test(id)
  // although at serve time it can work without processing, we do need to
  // crawl them in order to register watch dependencies.
  const needInlineImport = code.includes('@import')
  const hasUrl = cssUrlRE.test(code) || cssImageSetRE.test(code)
  const lang = id.match(CSS_LANGS_RE)?.[1] as CssLang | undefined
  const postcssConfig = await resolvePostcssConfig(config)

  // 1. plain css that needs no processing
  if (
    lang === 'css' &&
    !postcssConfig &&
    !isModule &&
    !needInlineImport &&
    !hasUrl
  ) {
    return { code, map: null }
  }

  let modules: Record<string, string> | undefined
  const deps = new Set<string>()

  // 2. pre-processors: sass etc.
  let preprocessorMap: ExistingRawSourceMap | undefined
  if (isPreProcessor(lang)) {
    const preprocessorResult = await compileCSSPreprocessors(
      id,
      lang,
      code,
      config,
    )
    code = preprocessorResult.code
    preprocessorMap = preprocessorResult.map
    preprocessorResult.deps?.forEach((dep) => deps.add(dep))
  }

  // 3. postcss
  const atImportResolvers = getAtImportResolvers(config)
  const postcssOptions = (postcssConfig && postcssConfig.options) || {}

  const postcssPlugins =
    postcssConfig && postcssConfig.plugins ? postcssConfig.plugins.slice() : []

  if (needInlineImport) {
    postcssPlugins.unshift(
      (await importPostcssImport()).default({
        async resolve(id, basedir) {
          const publicFile = checkPublicFile(id, config)
          if (publicFile) {
            return publicFile
          }

          const resolved = await atImportResolvers.css(
            id,
            path.join(basedir, '*'),
          )

          if (resolved) {
            return path.resolve(resolved)
          }

          // postcss-import falls back to `resolve` dep if this is unresolved,
          // but we've shimmed to remove the `resolve` dep to cut on bundle size.
          // warn here to provide a better error message.
          if (!path.isAbsolute(id)) {
            config.logger.error(
              colors.red(
                `Unable to resolve \`@import "${id}"\` from ${basedir}`,
              ),
            )
          }

          return id
        },
        async load(id) {
          const code = await fs.promises.readFile(id, 'utf-8')
          const lang = id.match(CSS_LANGS_RE)?.[1] as CssLang | undefined
          if (isPreProcessor(lang)) {
            const result = await compileCSSPreprocessors(id, lang, code, config)
            result.deps?.forEach((dep) => deps.add(dep))
            // TODO: support source map
            return result.code
          }
          return code
        },
        nameLayer(index) {
          return `vite--anon-layer-${getHash(id)}-${index}`
        },
      }),
    )
  }

  if (urlReplacer) {
    postcssPlugins.push(
      UrlRewritePostcssPlugin({
        replacer: urlReplacer,
        logger: config.logger,
      }),
    )
  }

  if (isModule) {
    postcssPlugins.unshift(
      (await importPostcssModules()).default({
        ...modulesOptions,
        localsConvention: modulesOptions?.localsConvention,
        getJSON(
          cssFileName: string,
          _modules: Record<string, string>,
          outputFileName: string,
        ) {
          modules = _modules
          if (modulesOptions && typeof modulesOptions.getJSON === 'function') {
            modulesOptions.getJSON(cssFileName, _modules, outputFileName)
          }
        },
        async resolve(id: string, importer: string) {
          for (const key of getCssResolversKeys(atImportResolvers)) {
            const resolved = await atImportResolvers[key](id, importer)
            if (resolved) {
              return path.resolve(resolved)
            }
          }

          return id
        },
      }),
    )
  }

  if (!postcssPlugins.length) {
    return {
      code,
      map: preprocessorMap,
      deps,
    }
  }

  let postcssResult: PostCSS.Result
  try {
    const source = removeDirectQuery(id)
    const postcss = await importPostcss()
    // postcss is an unbundled dep and should be lazy imported
    postcssResult = await postcss.default(postcssPlugins).process(code, {
      ...postcssOptions,
      parser:
        lang === 'sss'
          ? loadPreprocessor(PostCssDialectLang.sss, config.root)
          : postcssOptions.parser,
      to: source,
      from: source,
      ...(devSourcemap
        ? {
            map: {
              inline: false,
              annotation: false,
              // postcss may return virtual files
              // we cannot obtain content of them, so this needs to be enabled
              sourcesContent: true,
              // when "prev: preprocessorMap", the result map may include duplicate filename in `postcssResult.map.sources`
              // prev: preprocessorMap,
            },
          }
        : {}),
    })

    // record CSS dependencies from @imports
    for (const message of postcssResult.messages) {
      if (message.type === 'dependency') {
        deps.add(normalizePath(message.file as string))
      } else if (message.type === 'dir-dependency') {
        // https://github.com/postcss/postcss/blob/main/docs/guidelines/plugin.md#3-dependencies
        const { dir, glob: globPattern = '**' } = message
        const pattern =
          glob.escapePath(normalizePath(path.resolve(path.dirname(id), dir))) +
          `/` +
          globPattern
        const files = glob.sync(pattern, {
          ignore: ['**/node_modules/**'],
        })
        for (let i = 0; i < files.length; i++) {
          deps.add(files[i])
        }
      } else if (message.type === 'warning') {
        let msg = `[vite:css] ${message.text}`
        if (message.line && message.column) {
          msg += `\n${generateCodeFrame(code, {
            line: message.line,
            column: message.column,
          })}`
        }
        config.logger.warn(colors.yellow(msg))
      }
    }
  } catch (e) {
    e.message = `[postcss] ${e.message}`
    e.code = code
    e.loc = {
      column: e.column,
      line: e.line,
    }
    throw e
  }

  if (!devSourcemap) {
    return {
      ast: postcssResult,
      code: postcssResult.css,
      map: { mappings: '' },
      modules,
      deps,
    }
  }

  const rawPostcssMap = postcssResult.map.toJSON()

  const postcssMap = await formatPostcssSourceMap(
    // version property of rawPostcssMap is declared as string
    // but actually it is a number
    rawPostcssMap as Omit<RawSourceMap, 'version'> as ExistingRawSourceMap,
    cleanUrl(id),
  )

  return {
    ast: postcssResult,
    code: postcssResult.css,
    map: combineSourcemapsIfExists(cleanUrl(id), postcssMap, preprocessorMap),
    modules,
    deps,
  }
}

function createCachedImport<T>(imp: () => Promise<T>): () => T | Promise<T> {
  let cached: T | Promise<T>
  return () => {
    if (!cached) {
      cached = imp().then((module) => {
        cached = module
        return module
      })
    }
    return cached
  }
}
const importPostcssImport = createCachedImport(() => import('postcss-import'))
const importPostcssModules = createCachedImport(() => import('postcss-modules'))
const importPostcss = createCachedImport(() => import('postcss'))

export interface PreprocessCSSResult {
  code: string
  map?: SourceMapInput
  modules?: Record<string, string>
  deps?: Set<string>
}

/**
 * @experimental
 */
export async function preprocessCSS(
  code: string,
  filename: string,
  config: ResolvedConfig,
): Promise<PreprocessCSSResult> {
  return await compileCSS(filename, code, config)
}

const postcssReturnsVirtualFilesRE = /^<.+>$/

export async function formatPostcssSourceMap(
  rawMap: ExistingRawSourceMap,
  file: string,
): Promise<ExistingRawSourceMap> {
  const inputFileDir = path.dirname(file)

  const sources = rawMap.sources.map((source) => {
    const cleanSource = cleanUrl(decodeURIComponent(source))

    if (postcssReturnsVirtualFilesRE.test(cleanSource)) {
      return `\0${cleanSource}`
    }

    return normalizePath(path.resolve(inputFileDir, cleanSource))
  })

  return {
    file,
    mappings: rawMap.mappings,
    names: rawMap.names,
    sources,
    sourcesContent: rawMap.sourcesContent,
    version: rawMap.version,
  }
}

function combineSourcemapsIfExists(
  filename: string,
  map1: ExistingRawSourceMap | undefined,
  map2: ExistingRawSourceMap | undefined,
): ExistingRawSourceMap | undefined {
  return map1 && map2
    ? (combineSourcemaps(filename, [
        // type of version property of ExistingRawSourceMap is number
        // but it is always 3
        map1 as RawSourceMap,
        map2 as RawSourceMap,
      ]) as ExistingRawSourceMap)
    : map1
}

async function finalizeCss(
  css: string,
  minify: boolean,
  config: ResolvedConfig,
) {
  // hoist external @imports and @charset to the top of the CSS chunk per spec (#1845 and #6333)
  if (css.includes('@import') || css.includes('@charset')) {
    css = await hoistAtRules(css)
  }
  if (minify && config.build.cssMinify) {
    css = await minifyCSS(css, config, false)
  }
  return css
}

interface PostCSSConfigResult {
  options: PostCSS.ProcessOptions
  plugins: PostCSS.AcceptedPlugin[]
}

async function resolvePostcssConfig(
  config: ResolvedConfig,
): Promise<PostCSSConfigResult | null> {
  let result = postcssConfigCache.get(config)
  if (result !== undefined) {
    return await result
  }

  // inline postcss config via vite config
  const inlineOptions = config.css?.postcss
  if (isObject(inlineOptions)) {
    const options = { ...inlineOptions }

    delete options.plugins
    result = {
      options,
      plugins: inlineOptions.plugins || [],
    }
  } else {
    const searchPath =
      typeof inlineOptions === 'string' ? inlineOptions : config.root
    result = postcssrc({}, searchPath).catch((e) => {
      if (!/No PostCSS Config found/.test(e.message)) {
        if (e instanceof Error) {
          const { name, message, stack } = e
          e.name = 'Failed to load PostCSS config'
          e.message = `Failed to load PostCSS config (searchPath: ${searchPath}): [${name}] ${message}\n${stack}`
          e.stack = '' // add stack to message to retain stack
          throw e
        } else {
          throw new Error(`Failed to load PostCSS config: ${e}`)
        }
      }
      return null
    })
    // replace cached promise to result object when finished
    result.then((resolved) => {
      postcssConfigCache.set(config, resolved)
    })
  }

  postcssConfigCache.set(config, result)
  return result
}

type CssUrlReplacer = (
  url: string,
  importer?: string,
) => string | Promise<string>
// https://drafts.csswg.org/css-syntax-3/#identifier-code-point
export const cssUrlRE =
  /(?<=^|[^\w\-\u0080-\uffff])url\((\s*('[^']+'|"[^"]+")\s*|[^'")]+)\)/
export const cssDataUriRE =
  /(?<=^|[^\w\-\u0080-\uffff])data-uri\((\s*('[^']+'|"[^"]+")\s*|[^'")]+)\)/
export const importCssRE = /@import ('[^']+\.css'|"[^"]+\.css"|[^'")]+\.css)/
// Assuming a function name won't be longer than 256 chars
// eslint-disable-next-line regexp/no-unused-capturing-group -- doesn't detect asyncReplace usage
const cssImageSetRE = /(?<=image-set\()((?:[\w\-]{1,256}\([^)]*\)|[^)])*)(?=\))/

const UrlRewritePostcssPlugin: PostCSS.PluginCreator<{
  replacer: CssUrlReplacer
  logger: Logger
}> = (opts) => {
  if (!opts) {
    throw new Error('base or replace is required')
  }

  return {
    postcssPlugin: 'vite-url-rewrite',
    Once(root) {
      const promises: Promise<void>[] = []
      root.walkDecls((declaration) => {
        const importer = declaration.source?.input.file
        if (!importer) {
          opts.logger.warnOnce(
            '\nA PostCSS plugin did not pass the `from` option to `postcss.parse`. ' +
              'This may cause imported assets to be incorrectly transformed. ' +
              "If you've recently added a PostCSS plugin that raised this warning, " +
              'please contact the package author to fix the issue.',
          )
        }
        const isCssUrl = cssUrlRE.test(declaration.value)
        const isCssImageSet = cssImageSetRE.test(declaration.value)
        if (isCssUrl || isCssImageSet) {
          const replacerForDeclaration = (rawUrl: string) => {
            return opts.replacer(rawUrl, importer)
          }
          const rewriterToUse = isCssImageSet
            ? rewriteCssImageSet
            : rewriteCssUrls
          promises.push(
            rewriterToUse(declaration.value, replacerForDeclaration).then(
              (url) => {
                declaration.value = url
              },
            ),
          )
        }
      })
      if (promises.length) {
        return Promise.all(promises) as any
      }
    },
  }
}
UrlRewritePostcssPlugin.postcss = true

function rewriteCssUrls(
  css: string,
  replacer: CssUrlReplacer,
): Promise<string> {
  return asyncReplace(css, cssUrlRE, async (match) => {
    const [matched, rawUrl] = match
    return await doUrlReplace(rawUrl.trim(), matched, replacer)
  })
}

function rewriteCssDataUris(
  css: string,
  replacer: CssUrlReplacer,
): Promise<string> {
  return asyncReplace(css, cssDataUriRE, async (match) => {
    const [matched, rawUrl] = match
    return await doUrlReplace(rawUrl.trim(), matched, replacer, 'data-uri')
  })
}

function rewriteImportCss(
  css: string,
  replacer: CssUrlReplacer,
): Promise<string> {
  return asyncReplace(css, importCssRE, async (match) => {
    const [matched, rawUrl] = match
    return await doImportCSSReplace(rawUrl, matched, replacer)
  })
}

// TODO: image and cross-fade could contain a "url" that needs to be processed
// https://drafts.csswg.org/css-images-4/#image-notation
// https://drafts.csswg.org/css-images-4/#cross-fade-function
const cssNotProcessedRE = /(?:gradient|element|cross-fade|image)\(/

async function rewriteCssImageSet(
  css: string,
  replacer: CssUrlReplacer,
): Promise<string> {
  return await asyncReplace(css, cssImageSetRE, async (match) => {
    const [, rawUrl] = match
    const url = await processSrcSet(rawUrl, async ({ url }) => {
      // the url maybe url(...)
      if (cssUrlRE.test(url)) {
        return await rewriteCssUrls(url, replacer)
      }
      if (!cssNotProcessedRE.test(url)) {
        return await doUrlReplace(url, url, replacer)
      }
      return url
    })
    return url
  })
}
function skipUrlReplacer(rawUrl: string) {
  return (
    isExternalUrl(rawUrl) ||
    isDataUrl(rawUrl) ||
    rawUrl[0] === '#' ||
    varRE.test(rawUrl)
  )
}
async function doUrlReplace(
  rawUrl: string,
  matched: string,
  replacer: CssUrlReplacer,
  funcName: string = 'url',
) {
  let wrap = ''
  const first = rawUrl[0]
  if (first === `"` || first === `'`) {
    wrap = first
    rawUrl = rawUrl.slice(1, -1)
  }

  if (skipUrlReplacer(rawUrl)) {
    return matched
  }

  const newUrl = await replacer(rawUrl)
  if (wrap === '' && newUrl !== encodeURI(newUrl)) {
    // The new url might need wrapping even if the original did not have it, e.g. if a space was added during replacement
    wrap = "'"
  }
  return `${funcName}(${wrap}${newUrl}${wrap})`
}

async function doImportCSSReplace(
  rawUrl: string,
  matched: string,
  replacer: CssUrlReplacer,
) {
  let wrap = ''
  const first = rawUrl[0]
  if (first === `"` || first === `'`) {
    wrap = first
    rawUrl = rawUrl.slice(1, -1)
  }
  if (isExternalUrl(rawUrl) || isDataUrl(rawUrl) || rawUrl[0] === '#') {
    return matched
  }

  return `@import ${wrap}${await replacer(rawUrl)}${wrap}`
}

async function minifyCSS(
  css: string,
  config: ResolvedConfig,
  inlined: boolean,
) {
  // We want inlined CSS to not end with a linebreak, while ensuring that
  // regular CSS assets do end with a linebreak.
  // See https://github.com/vitejs/vite/pull/13893#issuecomment-1678628198

  if (config.build.cssMinify === 'lightningcss') {
    const { code, warnings } = (await importLightningCSS()).transform({
      ...config.css?.lightningcss,
      targets: convertTargets(config.build.cssTarget),
      cssModules: undefined,
      filename: cssBundleName,
      code: Buffer.from(css),
      minify: true,
    })
    if (warnings.length) {
      config.logger.warn(
        colors.yellow(
          `warnings when minifying css:\n${warnings
            .map((w) => w.message)
            .join('\n')}`,
        ),
      )
    }
    // LightningCSS output does not return a linebreak at the end
    return code.toString() + (inlined ? '' : '\n')
  }
  try {
    const { code, warnings } = await transform(css, {
      loader: 'css',
      target: config.build.cssTarget || undefined,
      ...resolveMinifyCssEsbuildOptions(config.esbuild || {}),
    })
    if (warnings.length) {
      const msgs = await formatMessages(warnings, { kind: 'warning' })
      config.logger.warn(
        colors.yellow(`warnings when minifying css:\n${msgs.join('\n')}`),
      )
    }
    // esbuild output does return a linebreak at the end
    return inlined ? code.trimEnd() : code
  } catch (e) {
    if (e.errors) {
      e.message = '[esbuild css minify] ' + e.message
      const msgs = await formatMessages(e.errors, { kind: 'error' })
      e.frame = '\n' + msgs.join('\n')
      e.loc = e.errors[0].location
    }
    throw e
  }
}

function resolveMinifyCssEsbuildOptions(
  options: ESBuildOptions,
): TransformOptions {
  const base: TransformOptions = {
    charset: options.charset ?? 'utf8',
    logLevel: options.logLevel,
    logLimit: options.logLimit,
    logOverride: options.logOverride,
    legalComments: options.legalComments,
  }

  if (
    options.minifyIdentifiers != null ||
    options.minifySyntax != null ||
    options.minifyWhitespace != null
  ) {
    return {
      ...base,
      minifyIdentifiers: options.minifyIdentifiers ?? true,
      minifySyntax: options.minifySyntax ?? true,
      minifyWhitespace: options.minifyWhitespace ?? true,
    }
  } else {
    return { ...base, minify: true }
  }
}

export async function hoistAtRules(css: string): Promise<string> {
  const s = new MagicString(css)
  const cleanCss = emptyCssComments(css)
  let match: RegExpExecArray | null

  // #1845
  // CSS @import can only appear at top of the file. We need to hoist all @import
  // to top when multiple files are concatenated.
  // match until semicolon that's not in quotes
  const atImportRE =
    /@import(?:\s*(?:url\([^)]*\)|"(?:[^"]|(?<=\\)")*"|'(?:[^']|(?<=\\)')*').*?|[^;]*);/g
  while ((match = atImportRE.exec(cleanCss))) {
    s.remove(match.index, match.index + match[0].length)
    // Use `appendLeft` instead of `prepend` to preserve original @import order
    s.appendLeft(0, match[0])
  }

  // #6333
  // CSS @charset must be the top-first in the file, hoist the first to top
  const atCharsetRE =
    /@charset(?:\s*(?:"(?:[^"]|(?<=\\)")*"|'(?:[^']|(?<=\\)')*').*?|[^;]*);/g
  let foundCharset = false
  while ((match = atCharsetRE.exec(cleanCss))) {
    s.remove(match.index, match.index + match[0].length)
    if (!foundCharset) {
      s.prepend(match[0])
      foundCharset = true
    }
  }

  return s.toString()
}

// Preprocessor support. This logic is largely replicated from @vue/compiler-sfc

type PreprocessorAdditionalDataResult =
  | string
  | { content: string; map?: ExistingRawSourceMap }

type PreprocessorAdditionalData =
  | string
  | ((
      source: string,
      filename: string,
    ) =>
      | PreprocessorAdditionalDataResult
      | Promise<PreprocessorAdditionalDataResult>)

type StylePreprocessorOptions = {
  [key: string]: any
  additionalData?: PreprocessorAdditionalData
  filename: string
  alias: Alias[]
  enableSourcemap: boolean
}

type SassStylePreprocessorOptions = StylePreprocessorOptions & Sass.Options

type StylusStylePreprocessorOptions = StylePreprocessorOptions & {
  define?: Record<string, any>
}

type StylePreprocessor = (
  source: string,
  root: string,
  options: StylePreprocessorOptions,
  resolvers: CSSAtImportResolvers,
) => StylePreprocessorResults | Promise<StylePreprocessorResults>

type SassStylePreprocessor = (
  source: string,
  root: string,
  options: SassStylePreprocessorOptions,
  resolvers: CSSAtImportResolvers,
) => StylePreprocessorResults | Promise<StylePreprocessorResults>

type StylusStylePreprocessor = (
  source: string,
  root: string,
  options: StylusStylePreprocessorOptions,
  resolvers: CSSAtImportResolvers,
) => StylePreprocessorResults | Promise<StylePreprocessorResults>

export interface StylePreprocessorResults {
  code: string
  map?: ExistingRawSourceMap | undefined
  additionalMap?: ExistingRawSourceMap | undefined
  error?: RollupError
  deps: string[]
}

const loadedPreprocessors: Partial<
  Record<PreprocessLang | PostCssDialectLang, any>
> = {}

// TODO: use dynamic import
const _require = createRequire(import.meta.url)

function loadPreprocessor(lang: PreprocessLang.scss, root: string): typeof Sass
function loadPreprocessor(lang: PreprocessLang.sass, root: string): typeof Sass
function loadPreprocessor(lang: PreprocessLang.less, root: string): typeof Less
function loadPreprocessor(
  lang: PreprocessLang.stylus,
  root: string,
): typeof Stylus
function loadPreprocessor(
  lang: PostCssDialectLang.sss,
  root: string,
): PostCSS.Parser
function loadPreprocessor(
  lang: PreprocessLang | PostCssDialectLang,
  root: string,
): any {
  if (lang in loadedPreprocessors) {
    return loadedPreprocessors[lang]
  }
  try {
    const resolved = requireResolveFromRootWithFallback(root, lang)
    return (loadedPreprocessors[lang] = _require(resolved))
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      const installCommand = getPackageManagerCommand('install')
      throw new Error(
        `Preprocessor dependency "${lang}" not found. Did you install it? Try \`${installCommand} -D ${lang}\`.`,
      )
    } else {
      const message = new Error(
        `Preprocessor dependency "${lang}" failed to load:\n${e.message}`,
      )
      message.stack = e.stack + '\n' + message.stack
      throw message
    }
  }
}

declare const window: unknown | undefined
declare const location: { href: string } | undefined

// in unix, scss might append `location.href` in environments that shim `location`
// see https://github.com/sass/dart-sass/issues/710
function cleanScssBugUrl(url: string) {
  if (
    // check bug via `window` and `location` global
    typeof window !== 'undefined' &&
    typeof location !== 'undefined' &&
    typeof location?.href === 'string'
  ) {
    const prefix = location.href.replace(/\/$/, '')
    return url.replace(prefix, '')
  } else {
    return url
  }
}

function fixScssBugImportValue(
  data: Sass.ImporterReturnType,
): Sass.ImporterReturnType {
  // the scss bug doesn't load files properly so we have to load it ourselves
  // to prevent internal error when it loads itself
  if (
    // check bug via `window` and `location` global
    typeof window !== 'undefined' &&
    typeof location !== 'undefined' &&
    data &&
    'file' in data &&
    (!('contents' in data) || data.contents == null)
  ) {
    // @ts-expect-error we need to preserve file property for HMR
    data.contents = fs.readFileSync(data.file, 'utf-8')
  }
  return data
}

// .scss/.sass processor
const scss: SassStylePreprocessor = async (
  source,
  root,
  options,
  resolvers,
) => {
  const render = loadPreprocessor(PreprocessLang.sass, root).render
  // NOTE: `sass` always runs it's own importer first, and only falls back to
  // the `importer` option when it can't resolve a path
  const internalImporter: Sass.Importer = (url, importer, done) => {
    importer = cleanScssBugUrl(importer)
    resolvers.sass(url, importer).then((resolved) => {
      if (resolved) {
        rebaseUrls(resolved, options.filename, options.alias, '$')
          .then((data) => done?.(fixScssBugImportValue(data)))
          .catch((data) => done?.(data))
      } else {
        done?.(null)
      }
    })
  }
  const importer = [internalImporter]
  if (options.importer) {
    Array.isArray(options.importer)
      ? importer.unshift(...options.importer)
      : importer.unshift(options.importer)
  }

  const { content: data, map: additionalMap } = await getSource(
    source,
    options.filename,
    options.additionalData,
    options.enableSourcemap,
  )
  const finalOptions: Sass.Options = {
    ...options,
    data,
    file: options.filename,
    outFile: options.filename,
    importer,
    ...(options.enableSourcemap
      ? {
          sourceMap: true,
          omitSourceMapUrl: true,
          sourceMapRoot: path.dirname(options.filename),
        }
      : {}),
  }

  try {
    const result = await new Promise<Sass.Result>((resolve, reject) => {
      render(finalOptions, (err, res) => {
        if (err) {
          reject(err)
        } else {
          resolve(res)
        }
      })
    })
    const deps = result.stats.includedFiles.map((f) => cleanScssBugUrl(f))
    const map: ExistingRawSourceMap | undefined = result.map
      ? JSON.parse(result.map.toString())
      : undefined

    return {
      code: result.css.toString(),
      map,
      additionalMap,
      deps,
    }
  } catch (e) {
    // normalize SASS error
    e.message = `[sass] ${e.message}`
    e.id = e.file
    e.frame = e.formatted
    return { code: '', error: e, deps: [] }
  }
}

const sass: SassStylePreprocessor = (source, root, options, aliasResolver) =>
  scss(
    source,
    root,
    {
      ...options,
      indentedSyntax: true,
    },
    aliasResolver,
  )

/**
 * relative url() inside \@imported sass and less files must be rebased to use
 * root file as base.
 */
async function rebaseUrls(
  file: string,
  rootFile: string,
  alias: Alias[],
  variablePrefix: string,
): Promise<Sass.ImporterReturnType> {
  file = path.resolve(file) // ensure os-specific flashes
  // in the same dir, no need to rebase
  const fileDir = path.dirname(file)
  const rootDir = path.dirname(rootFile)
  if (fileDir === rootDir) {
    return { file }
  }

  const content = await fsp.readFile(file, 'utf-8')
  // no url()
  const hasUrls = cssUrlRE.test(content)
  // data-uri() calls
  const hasDataUris = cssDataUriRE.test(content)
  // no @import xxx.css
  const hasImportCss = importCssRE.test(content)

  if (!hasUrls && !hasDataUris && !hasImportCss) {
    return { file }
  }

  let rebased
  const rebaseFn = (url: string) => {
    if (url[0] === '/') return url
    // ignore url's starting with variable
    if (url.startsWith(variablePrefix)) return url
    // match alias, no need to rewrite
    for (const { find } of alias) {
      const matches =
        typeof find === 'string' ? url.startsWith(find) : find.test(url)
      if (matches) {
        return url
      }
    }
    const absolute = path.resolve(fileDir, url)
    const relative = path.relative(rootDir, absolute)
    return normalizePath(relative)
  }

  // fix css imports in less such as `@import "foo.css"`
  if (hasImportCss) {
    rebased = await rewriteImportCss(content, rebaseFn)
  }

  if (hasUrls) {
    rebased = await rewriteCssUrls(rebased || content, rebaseFn)
  }

  if (hasDataUris) {
    rebased = await rewriteCssDataUris(rebased || content, rebaseFn)
  }

  return {
    file,
    contents: rebased,
  }
}

// .less
const less: StylePreprocessor = async (source, root, options, resolvers) => {
  const nodeLess = loadPreprocessor(PreprocessLang.less, root)
  const viteResolverPlugin = createViteLessPlugin(
    nodeLess,
    options.filename,
    options.alias,
    resolvers,
  )
  const { content, map: additionalMap } = await getSource(
    source,
    options.filename,
    options.additionalData,
    options.enableSourcemap,
  )

  let result: Less.RenderOutput | undefined
  try {
    result = await nodeLess.render(content, {
      ...options,
      plugins: [viteResolverPlugin, ...(options.plugins || [])],
      ...(options.enableSourcemap
        ? {
            sourceMap: {
              outputSourceFiles: true,
              sourceMapFileInline: false,
            },
          }
        : {}),
    })
  } catch (e) {
    const error = e as Less.RenderError
    // normalize error info
    const normalizedError: RollupError = new Error(
      `[less] ${error.message || error.type}`,
    ) as RollupError
    normalizedError.loc = {
      file: error.filename || options.filename,
      line: error.line,
      column: error.column,
    }
    return { code: '', error: normalizedError, deps: [] }
  }

  const map: ExistingRawSourceMap = result.map && JSON.parse(result.map)
  if (map) {
    delete map.sourcesContent
  }

  return {
    code: result.css.toString(),
    map,
    additionalMap,
    deps: result.imports,
  }
}

/**
 * Less manager, lazy initialized
 */
let ViteLessManager: any

function createViteLessPlugin(
  less: typeof Less,
  rootFile: string,
  alias: Alias[],
  resolvers: CSSAtImportResolvers,
): Less.Plugin {
  if (!ViteLessManager) {
    ViteLessManager = class ViteManager extends less.FileManager {
      resolvers
      rootFile
      alias
      constructor(
        rootFile: string,
        resolvers: CSSAtImportResolvers,
        alias: Alias[],
      ) {
        super()
        this.rootFile = rootFile
        this.resolvers = resolvers
        this.alias = alias
      }
      override supports(filename: string) {
        return !isExternalUrl(filename)
      }
      override supportsSync() {
        return false
      }
      override async loadFile(
        filename: string,
        dir: string,
        opts: any,
        env: any,
      ): Promise<Less.FileLoadResult> {
        const resolved = await this.resolvers.less(
          filename,
          path.join(dir, '*'),
        )
        if (resolved) {
          const result = await rebaseUrls(
            resolved,
            this.rootFile,
            this.alias,
            '@',
          )
          let contents: string
          if (result && 'contents' in result) {
            contents = result.contents
          } else {
            contents = await fsp.readFile(resolved, 'utf-8')
          }
          return {
            filename: path.resolve(resolved),
            contents,
          }
        } else {
          return super.loadFile(filename, dir, opts, env)
        }
      }
    }
  }

  return {
    install(_, pluginManager) {
      pluginManager.addFileManager(
        new ViteLessManager(rootFile, resolvers, alias),
      )
    },
    minVersion: [3, 0, 0],
  }
}

// .styl
const styl: StylusStylePreprocessor = async (source, root, options) => {
  const nodeStylus = loadPreprocessor(PreprocessLang.stylus, root)
  // Get source with preprocessor options.additionalData. Make sure a new line separator
  // is added to avoid any render error, as added stylus content may not have semi-colon separators
  const { content, map: additionalMap } = await getSource(
    source,
    options.filename,
    options.additionalData,
    options.enableSourcemap,
    '\n',
  )
  // Get preprocessor options.imports dependencies as stylus
  // does not return them with its builtin `.deps()` method
  const importsDeps = (options.imports ?? []).map((dep: string) =>
    path.resolve(dep),
  )
  try {
    const ref = nodeStylus(content, options)
    if (options.define) {
      for (const key in options.define) {
        ref.define(key, options.define[key])
      }
    }
    if (options.enableSourcemap) {
      ref.set('sourcemap', {
        comment: false,
        inline: false,
        basePath: root,
      })
    }

    const result = ref.render()

    // Concat imports deps with computed deps
    const deps = [...ref.deps(), ...importsDeps]

    // @ts-expect-error sourcemap exists
    const map: ExistingRawSourceMap | undefined = ref.sourcemap

    return {
      code: result,
      map: formatStylusSourceMap(map, root),
      additionalMap,
      deps,
    }
  } catch (e) {
    e.message = `[stylus] ${e.message}`
    return { code: '', error: e, deps: [] }
  }
}

function formatStylusSourceMap(
  mapBefore: ExistingRawSourceMap | undefined,
  root: string,
): ExistingRawSourceMap | undefined {
  if (!mapBefore) return undefined
  const map = { ...mapBefore }

  const resolveFromRoot = (p: string) => normalizePath(path.resolve(root, p))

  if (map.file) {
    map.file = resolveFromRoot(map.file)
  }
  map.sources = map.sources.map(resolveFromRoot)

  return map
}

async function getSource(
  source: string,
  filename: string,
  additionalData: PreprocessorAdditionalData | undefined,
  enableSourcemap: boolean,
  sep: string = '',
): Promise<{ content: string; map?: ExistingRawSourceMap }> {
  if (!additionalData) return { content: source }

  if (typeof additionalData === 'function') {
    const newContent = await additionalData(source, filename)
    if (typeof newContent === 'string') {
      return { content: newContent }
    }
    return newContent
  }

  if (!enableSourcemap) {
    return { content: additionalData + sep + source }
  }

  const ms = new MagicString(source)
  ms.appendLeft(0, sep)
  ms.appendLeft(0, additionalData)

  const map = ms.generateMap({ hires: 'boundary' })
  map.file = filename
  map.sources = [filename]

  return {
    content: ms.toString(),
    map,
  }
}

const preProcessors = Object.freeze({
  [PreprocessLang.less]: less,
  [PreprocessLang.sass]: sass,
  [PreprocessLang.scss]: scss,
  [PreprocessLang.styl]: styl,
  [PreprocessLang.stylus]: styl,
})

function isPreProcessor(lang: any): lang is PreprocessLang {
  return lang && lang in preProcessors
}

const importLightningCSS = createCachedImport(() => import('lightningcss'))

async function compileLightningCSS(
  id: string,
  src: string,
  config: ResolvedConfig,
  urlReplacer?: CssUrlReplacer,
): ReturnType<typeof compileCSS> {
  const deps = new Set<string>()
  // Relative path is needed to get stable hash when using CSS modules
  const filename = cleanUrl(path.relative(config.root, id))
  const toAbsolute = (filePath: string) =>
    path.isAbsolute(filePath) ? filePath : path.join(config.root, filePath)

  const res = styleAttrRE.test(id)
    ? (await importLightningCSS()).transformStyleAttribute({
        filename,
        code: Buffer.from(src),
        targets: config.css?.lightningcss?.targets,
        minify: config.isProduction && !!config.build.cssMinify,
        analyzeDependencies: true,
      })
    : await (
        await importLightningCSS()
      ).bundleAsync({
        ...config.css?.lightningcss,
        filename,
        resolver: {
          read(filePath) {
            if (filePath === filename) {
              return src
            }
            // This happens with html-proxy (#13776)
            if (!filePath.endsWith('.css')) {
              return src
            }
            return fs.readFileSync(toAbsolute(filePath), 'utf-8')
          },
          async resolve(id, from) {
            const publicFile = checkPublicFile(id, config)
            if (publicFile) {
              return publicFile
            }

            const resolved = await getAtImportResolvers(config).css(
              id,
              toAbsolute(from),
            )

            if (resolved) {
              deps.add(resolved)
              return resolved
            }
            return id
          },
        },
        minify: config.isProduction && !!config.build.cssMinify,
        sourceMap: config.css?.devSourcemap,
        analyzeDependencies: true,
        cssModules: cssModuleRE.test(id)
          ? config.css?.lightningcss?.cssModules ?? true
          : undefined,
      })

  let css = res.code.toString()
  for (const dep of res.dependencies!) {
    switch (dep.type) {
      case 'url':
        if (skipUrlReplacer(dep.url)) {
          css = css.replace(dep.placeholder, dep.url)
          break
        }
        deps.add(dep.url)
        if (urlReplacer) {
          css = css.replace(dep.placeholder, await urlReplacer(dep.url, id))
        }
        break
      default:
        throw new Error(`Unsupported dependency type: ${dep.type}`)
    }
  }

  let modules: Record<string, string> | undefined
  if ('exports' in res && res.exports) {
    modules = {}
    // https://github.com/parcel-bundler/lightningcss/issues/291
    const sortedEntries = Object.entries(res.exports).sort((a, b) =>
      a[0].localeCompare(b[0]),
    )
    for (const [key, value] of sortedEntries) {
      modules[key] = value.name
      // https://lightningcss.dev/css-modules.html#class-composition
      for (const c of value.composes) {
        modules[key] += ' ' + c.name
      }
    }
  }

  return {
    code: css,
    map: 'map' in res ? res.map?.toString() : undefined,
    deps,
    modules,
  }
}

// Convert https://esbuild.github.io/api/#target
// To https://github.com/parcel-bundler/lightningcss/blob/master/node/targets.d.ts

const map: Record<
  string,
  keyof NonNullable<LightningCSSOptions['targets']> | false | undefined
> = {
  chrome: 'chrome',
  edge: 'edge',
  firefox: 'firefox',
  hermes: false,
  ie: 'ie',
  ios: 'ios_saf',
  node: false,
  opera: 'opera',
  rhino: false,
  safari: 'safari',
}

const esMap: Record<number, string[]> = {
  // https://caniuse.com/?search=es2015
  2015: ['chrome49', 'edge13', 'safari10', 'firefox44', 'opera36'],
  // https://caniuse.com/?search=es2016
  2016: ['chrome50', 'edge13', 'safari10', 'firefox43', 'opera37'],
  // https://caniuse.com/?search=es2017
  2017: ['chrome58', 'edge15', 'safari11', 'firefox52', 'opera45'],
  // https://caniuse.com/?search=es2018
  2018: ['chrome63', 'edge79', 'safari12', 'firefox58', 'opera50'],
  // https://caniuse.com/?search=es2019
  2019: ['chrome73', 'edge79', 'safari12.1', 'firefox64', 'opera60'],
  // https://caniuse.com/?search=es2020
  2020: ['chrome80', 'edge80', 'safari14.1', 'firefox80', 'opera67'],
  // https://caniuse.com/?search=es2021
  2021: ['chrome85', 'edge85', 'safari14.1', 'firefox80', 'opera71'],
  // https://caniuse.com/?search=es2022
  2022: ['chrome94', 'edge94', 'safari16.4', 'firefox93', 'opera80'],
}

const esRE = /es(\d{4})/
const versionRE = /\d/

const convertTargetsCache = new Map<
  string | string[],
  LightningCSSOptions['targets']
>()
export const convertTargets = (
  esbuildTarget: string | string[] | false,
): LightningCSSOptions['targets'] => {
  if (!esbuildTarget) return {}
  const cached = convertTargetsCache.get(esbuildTarget)
  if (cached) return cached
  const targets: LightningCSSOptions['targets'] = {}

  const entriesWithoutES = arraify(esbuildTarget).flatMap((e) => {
    const match = e.match(esRE)
    if (!match) return e
    const year = Number(match[1])
    if (!esMap[year]) throw new Error(`Unsupported target "${e}"`)
    return esMap[year]
  })

  for (const entry of entriesWithoutES) {
    if (entry === 'esnext') continue
    const index = entry.match(versionRE)?.index
    if (index) {
      const browser = map[entry.slice(0, index)]
      if (browser === false) continue // No mapping available
      if (browser) {
        const [major, minor = 0] = entry
          .slice(index)
          .split('.')
          .map((v) => parseInt(v, 10))
        if (!isNaN(major) && !isNaN(minor)) {
          const version = (major << 16) | (minor << 8)
          if (!targets[browser] || version < targets[browser]!) {
            targets[browser] = version
          }
          continue
        }
      }
    }
    throw new Error(`Unsupported target "${entry}"`)
  }

  convertTargetsCache.set(esbuildTarget, targets)
  return targets
}
