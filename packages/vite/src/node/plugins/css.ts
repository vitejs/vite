import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import postcssrc from 'postcss-load-config'
import type {
  ExistingRawSourceMap,
  ModuleFormat,
  OutputAsset,
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
import { WorkerWithFallback } from 'artichokie'
import { globSync } from 'tinyglobby'
import type {
  LessPreprocessorBaseOptions,
  SassLegacyPreprocessBaseOptions,
  SassModernPreprocessBaseOptions,
  StylusPreprocessorBaseOptions,
} from 'types/cssPreprocessorOptions'
import { getCodeWithSourcemap, injectSourcesContent } from '../server/sourcemap'
import type { EnvironmentModuleNode } from '../server/moduleGraph'
import {
  createToImportMetaURLBasedRelativeRuntime,
  resolveUserExternal,
  toOutputFilePathInCss,
  toOutputFilePathInJS,
} from '../build'
import {
  CLIENT_PUBLIC_PATH,
  CSS_LANGS_RE,
  ESBUILD_MODULES_TARGET,
  SPECIAL_QUERY_RE,
} from '../constants'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import { checkPublicFile } from '../publicDir'
import {
  arraify,
  asyncReplace,
  combineSourcemaps,
  createSerialPromiseQueue,
  emptyCssComments,
  encodeURIPath,
  generateCodeFrame,
  getHash,
  getPackageManagerCommand,
  injectQuery,
  isDataUrl,
  isExternalUrl,
  isObject,
  joinUrlSegments,
  normalizePath,
  processSrcSet,
  removeDirectQuery,
  removeUrlQuery,
  requireResolveFromRootWithFallback,
  stripBomTag,
  urlRE,
} from '../utils'
import type { Logger } from '../logger'
import { cleanUrl, slash } from '../../shared/utils'
import { createBackCompatIdResolver } from '../idResolver'
import type { ResolveIdFn } from '../idResolver'
import { PartialEnvironment } from '../baseEnvironment'
import type { TransformPluginContext } from '../server/pluginContainer'
import type { DevEnvironment } from '..'
import { addToHTMLProxyTransformResult } from './html'
import {
  assetUrlRE,
  cssEntriesMap,
  fileToDevUrl,
  fileToUrl,
  publicAssetUrlCache,
  publicAssetUrlRE,
  publicFileToBuiltUrl,
  renderAssetUrlInJS,
} from './asset'
import type { ESBuildOptions } from './esbuild'
import { getChunkOriginalFileName } from './manifest'

const decoder = new TextDecoder()
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
  /**
   * Options for preprocessors.
   *
   * In addition to options specific to each processors, Vite supports `additionalData` option.
   * The `additionalData` option can be used to inject extra code for each style content.
   */
  preprocessorOptions?: {
    scss?: SassPreprocessorOptions
    sass?: SassPreprocessorOptions
    less?: LessPreprocessorOptions
    styl?: StylusPreprocessorOptions
    stylus?: StylusPreprocessorOptions
  }

  /**
   * If this option is set, preprocessors will run in workers when possible.
   * `true` means the number of CPUs minus 1.
   *
   * @default 0
   * @experimental
   */
  preprocessorMaxWorkers?: number | true
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
  exportGlobals?: boolean
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
): ResolvedCSSOptions {
  if (options?.transformer === 'lightningcss') {
    return {
      ...options,
      lightningcss: {
        ...options.lightningcss,
        targets:
          options.lightningcss?.targets ??
          convertTargets(ESBUILD_MODULES_TARGET),
      },
    }
  }
  return { ...options, lightningcss: undefined }
}

const cssModuleRE = new RegExp(`\\.module${CSS_LANGS_RE.source}`)
const directRequestRE = /[?&]direct\b/
const htmlProxyRE = /[?&]html-proxy\b/
const htmlProxyIndexRE = /&index=(\d+)/
const commonjsProxyRE = /\?commonjs-proxy/
const inlineRE = /[?&]inline\b/
const inlineCSSRE = /[?&]inline-css\b/
const styleAttrRE = /[?&]style-attr\b/
const functionCallRE = /^[A-Z_][.\w-]*\(/i
const transformOnlyRE = /[?&]transform-only\b/
const nonEscapedDoubleQuoteRe = /(?<!\\)"/g

const cssBundleName = 'style.css'

const enum PreprocessLang {
  less = 'less',
  sass = 'sass',
  scss = 'scss',
  styl = 'styl',
  stylus = 'stylus',
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- bug in typescript-eslint
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

const cssUrlAssetRE = /__VITE_CSS_URL__([\da-f]+)__/g

/**
 * Plugin applied before user plugins
 */
export function cssPlugin(config: ResolvedConfig): Plugin {
  const isBuild = config.command === 'build'
  let moduleCache: Map<string, Record<string, string>>

  const idResolver = createBackCompatIdResolver(config, {
    preferRelative: true,
    tryIndex: false,
    extensions: [],
  })

  let preprocessorWorkerController: PreprocessorWorkerController | undefined

  // warm up cache for resolved postcss config
  if (config.css?.transformer !== 'lightningcss') {
    resolvePostcssConfig(config)
  }

  return {
    name: 'vite:css',

    buildStart() {
      // Ensure a new cache for every build (i.e. rebuilding in watch mode)
      moduleCache = new Map<string, Record<string, string>>()
      cssModulesCache.set(config, moduleCache)

      removedPureCssFilesCache.set(config, new Map<string, RenderedChunk>())

      preprocessorWorkerController = createPreprocessorWorkerController(
        normalizeMaxWorkers(config.css.preprocessorMaxWorkers),
      )
      preprocessorWorkerControllerCache.set(
        config,
        preprocessorWorkerController,
      )
    },

    buildEnd() {
      preprocessorWorkerController?.close()
    },

    async load(id) {
      if (!isCSSRequest(id)) return

      if (urlRE.test(id)) {
        if (isModuleCSSRequest(id)) {
          throw new Error(
            `?url is not supported with CSS modules. (tried to import ${JSON.stringify(
              id,
            )})`,
          )
        }

        // *.css?url
        // in dev, it's handled by assets plugin.
        if (isBuild) {
          id = injectQuery(removeUrlQuery(id), 'transform-only')
          return (
            `import ${JSON.stringify(id)};` +
            `export default "__VITE_CSS_URL__${Buffer.from(id).toString(
              'hex',
            )}__"`
          )
        }
      }
    },

    async transform(raw, id) {
      const { environment } = this
      if (
        !isCSSRequest(id) ||
        commonjsProxyRE.test(id) ||
        SPECIAL_QUERY_RE.test(id)
      ) {
        return
      }
      const resolveUrl = (url: string, importer?: string) =>
        idResolver(environment, url, importer)

      const urlReplacer: CssUrlReplacer = async (url, importer) => {
        const decodedUrl = decodeURI(url)
        if (checkPublicFile(decodedUrl, config)) {
          if (encodePublicUrlsInCSS(config)) {
            return publicFileToBuiltUrl(decodedUrl, config)
          } else {
            return joinUrlSegments(config.base, decodedUrl)
          }
        }
        const [id, fragment] = decodedUrl.split('#')
        let resolved = await resolveUrl(id, importer)
        if (resolved) {
          if (fragment) resolved += '#' + fragment
          return fileToUrl(this, resolved)
        }
        if (config.command === 'build') {
          const isExternal = config.build.rollupOptions.external
            ? resolveUserExternal(
                config.build.rollupOptions.external,
                decodedUrl, // use URL as id since id could not be resolved
                id,
                false,
              )
            : false

          if (!isExternal) {
            // #9800 If we cannot resolve the css url, leave a warning.
            config.logger.warnOnce(
              `\n${decodedUrl} referenced in ${id} didn't resolve at build time, it will remain unchanged to be resolved at runtime`,
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
      } = await compileCSS(
        environment,
        id,
        raw,
        preprocessorWorkerController!,
        urlReplacer,
      )
      if (modules) {
        moduleCache.set(id, modules)
      }

      if (deps) {
        for (const file of deps) {
          this.addWatchFile(file)
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
  // queue to emit css serially to guarantee the files are emitted in a deterministic order
  let codeSplitEmitQueue = createSerialPromiseQueue<string>()
  const urlEmitQueue = createSerialPromiseQueue<unknown>()
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
    const cssAssetNameDir = path.dirname(cssAssetName)
    if (!assetFileNames) {
      return path.join(config.build.assetsDir, cssAssetNameDir)
    } else if (typeof assetFileNames === 'string') {
      return path.join(path.dirname(assetFileNames), cssAssetNameDir)
    } else {
      return path.dirname(
        assetFileNames({
          type: 'asset',
          name: cssAssetName,
          names: [cssAssetName],
          originalFileName: null,
          originalFileNames: [],
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
      codeSplitEmitQueue = createSerialPromiseQueue()
    },

    async transform(css, id) {
      if (
        !isCSSRequest(id) ||
        commonjsProxyRE.test(id) ||
        SPECIAL_QUERY_RE.test(id)
      ) {
        return
      }

      css = stripBomTag(css)

      // cache css compile result to map
      // and then use the cache replace inline-style-flag
      // when `generateBundle` in vite:build-html plugin and devHtmlHook
      const inlineCSS = inlineCSSRE.test(id)
      const isHTMLProxy = htmlProxyRE.test(id)
      if (inlineCSS && isHTMLProxy) {
        if (styleAttrRE.test(id)) {
          css = css.replace(/"/g, '&quot;')
        }
        const index = htmlProxyIndexRE.exec(id)?.[1]
        if (index == null) {
          throw new Error(`HTML proxy index in "${id}" not found`)
        }
        addToHTMLProxyTransformResult(
          `${getHash(cleanUrl(id))}_${Number.parseInt(index)}`,
          css,
        )
        return `export default ''`
      }

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
        if (this.environment.config.consumer !== 'client') {
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
        moduleSideEffects: modulesCode || inlined ? false : 'no-treeshake',
      }
    },

    async renderChunk(code, chunk, opts) {
      let chunkCSS = ''
      // the chunk is empty if it's a dynamic entry chunk that only contains a CSS import
      const isJsChunkEmpty = code === '' && !chunk.isEntry
      let isPureCssChunk = chunk.exports.length === 0
      const ids = Object.keys(chunk.modules)
      for (const id of ids) {
        if (styles.has(id)) {
          // ?transform-only is used for ?url and shouldn't be included in normal CSS chunks
          if (!transformOnlyRE.test(id)) {
            chunkCSS += styles.get(id)
            // a css module contains JS, so it makes this not a pure css chunk
            if (cssModuleRE.test(id)) {
              isPureCssChunk = false
            }
          }
        } else if (!isJsChunkEmpty) {
          // if the module does not have a style, then it's not a pure css chunk.
          // this is true because in the `transform` hook above, only modules
          // that are css gets added to the `styles` map.
          isPureCssChunk = false
        }
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
            ? slash(getCssAssetDirname(cssAssetName))
            : undefined

        const toRelative = (filename: string) => {
          // relative base + extracted CSS
          const relativePath = normalizePath(
            path.relative(cssAssetDirname!, filename),
          )
          return relativePath[0] === '.' ? relativePath : './' + relativePath
        }

        // replace asset url references with resolved url.
        chunkCSS = chunkCSS.replace(assetUrlRE, (_, fileHash, postfix = '') => {
          const filename = this.getFileName(fileHash) + postfix
          chunk.viteMetadata!.importedAssets.add(cleanUrl(filename))
          return encodeURIPath(
            toOutputFilePathInCss(
              filename,
              'asset',
              cssAssetName,
              'css',
              config,
              toRelative,
            ),
          )
        })
        // resolve public URL from CSS paths
        if (encodedPublicUrls) {
          const relativePathToPublicFromCSS = normalizePath(
            path.relative(cssAssetDirname!, ''),
          )
          chunkCSS = chunkCSS.replace(publicAssetUrlRE, (_, hash) => {
            const publicUrl = publicAssetUrlMap.get(hash)!.slice(1)
            return encodeURIPath(
              toOutputFilePathInCss(
                publicUrl,
                'public',
                cssAssetName,
                'css',
                config,
                () => `${relativePathToPublicFromCSS}/${publicUrl}`,
              ),
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

      let s: MagicString | undefined
      const urlEmitTasks: Array<{
        cssAssetName: string
        originalFileName: string
        content: string
        start: number
        end: number
      }> = []

      if (code.includes('__VITE_CSS_URL__')) {
        let match: RegExpExecArray | null
        cssUrlAssetRE.lastIndex = 0
        while ((match = cssUrlAssetRE.exec(code))) {
          const [full, idHex] = match
          const id = Buffer.from(idHex, 'hex').toString()
          const originalFileName = cleanUrl(id)
          const cssAssetName = ensureFileExt(
            path.basename(originalFileName),
            '.css',
          )
          if (!styles.has(id)) {
            throw new Error(
              `css content for ${JSON.stringify(id)} was not found`,
            )
          }

          let cssContent = styles.get(id)!

          cssContent = resolveAssetUrlsInCss(cssContent, cssAssetName)

          urlEmitTasks.push({
            cssAssetName,
            originalFileName,
            content: cssContent,
            start: match.index,
            end: match.index + full.length,
          })
        }
      }

      // should await even if this chunk does not include __VITE_CSS_URL__
      // so that code after this line runs in the same order
      await urlEmitQueue.run(async () =>
        Promise.all(
          urlEmitTasks.map(async (info) => {
            info.content = await finalizeCss(info.content, true, config)
          }),
        ),
      )
      if (urlEmitTasks.length > 0) {
        const toRelativeRuntime = createToImportMetaURLBasedRelativeRuntime(
          opts.format,
          config.isWorker,
        )
        s ||= new MagicString(code)

        for (const {
          cssAssetName,
          originalFileName,
          content,
          start,
          end,
        } of urlEmitTasks) {
          const referenceId = this.emitFile({
            type: 'asset',
            name: cssAssetName,
            originalFileName,
            source: content,
          })

          const filename = this.getFileName(referenceId)
          chunk.viteMetadata!.importedAssets.add(cleanUrl(filename))
          const replacement = toOutputFilePathInJS(
            this.environment,
            filename,
            'asset',
            chunk.fileName,
            'js',
            toRelativeRuntime,
          )
          const replacementString =
            typeof replacement === 'string'
              ? JSON.stringify(encodeURIPath(replacement)).slice(1, -1)
              : `"+${replacement.runtime}+"`
          s.update(start, end, replacementString)
        }
      }

      if (chunkCSS) {
        if (isPureCssChunk && (opts.format === 'es' || opts.format === 'cjs')) {
          // this is a shared CSS-only chunk that is empty.
          pureCssChunks.add(chunk)
        }

        if (config.build.cssCodeSplit) {
          if (opts.format === 'es' || opts.format === 'cjs') {
            const isEntry = chunk.isEntry && isPureCssChunk
            const cssFullAssetName = ensureFileExt(chunk.name, '.css')
            // if facadeModuleId doesn't exist or doesn't have a CSS extension,
            // that means a JS entry file imports a CSS file.
            // in this case, only use the filename for the CSS chunk name like JS chunks.
            const cssAssetName =
              chunk.isEntry &&
              (!chunk.facadeModuleId || !isCSSRequest(chunk.facadeModuleId))
                ? path.basename(cssFullAssetName)
                : cssFullAssetName
            const originalFileName = getChunkOriginalFileName(
              chunk,
              config.root,
              opts.format,
            )

            chunkCSS = resolveAssetUrlsInCss(chunkCSS, cssAssetName)

            // wait for previous tasks as well
            chunkCSS = await codeSplitEmitQueue.run(async () => {
              return finalizeCss(chunkCSS, true, config)
            })

            // emit corresponding css file
            const referenceId = this.emitFile({
              type: 'asset',
              name: cssAssetName,
              originalFileName,
              source: chunkCSS,
            })
            if (isEntry) {
              cssEntriesMap.get(this.environment)!.add(referenceId)
            }
            chunk.viteMetadata!.importedCss.add(this.getFileName(referenceId))
          } else if (this.environment.config.consumer === 'client') {
            // legacy build and inline css

            // Entry chunk CSS will be collected into `chunk.viteMetadata.importedCss`
            // and injected later by the `'vite:build-html'` plugin into the `index.html`
            // so it will be duplicated. (https://github.com/vitejs/vite/issues/2062#issuecomment-782388010)
            // But because entry chunk can be imported by dynamic import,
            // we shouldn't remove the inlined CSS. (#10285)

            chunkCSS = await finalizeCss(chunkCSS, true, config)
            let cssString = JSON.stringify(chunkCSS)
            cssString =
              renderAssetUrlInJS(this, chunk, opts, cssString)?.toString() ||
              cssString
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
            s ||= new MagicString(code)
            s.appendRight(injectionPoint, injectCode)
          }
        } else {
          // resolve public URL from CSS paths, we need to use absolute paths
          chunkCSS = resolveAssetUrlsInCss(chunkCSS, cssBundleName)
          // finalizeCss is called for the aggregated chunk in generateBundle

          chunkCSSMap.set(chunk.fileName, chunkCSS)
        }
      }

      if (s) {
        if (config.build.sourcemap) {
          return {
            code: s.toString(),
            map: s.generateMap({ hires: 'boundary' }),
          }
        } else {
          return { code: s.toString() }
        }
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

      function extractCss() {
        let css = ''
        const collected = new Set<OutputChunk>()
        // will be populated in order they are used by entry points
        const dynamicImports = new Set<string>()

        function collect(chunk: OutputChunk | OutputAsset) {
          if (!chunk || chunk.type !== 'chunk' || collected.has(chunk)) return
          collected.add(chunk)

          // First collect all styles from the synchronous imports (lowest priority)
          chunk.imports.forEach((importName) => collect(bundle[importName]))
          // Save dynamic imports in deterministic order to add the styles later (to have the highest priority)
          chunk.dynamicImports.forEach((importName) =>
            dynamicImports.add(importName),
          )
          // Then collect the styles of the current chunk (might overwrite some styles from previous imports)
          css += chunkCSSMap.get(chunk.preliminaryFileName) ?? ''
        }

        // The bundle is guaranteed to be deterministic, if not then we have a bug in rollup.
        // So we use it to ensure a deterministic order of styles
        for (const chunk of Object.values(bundle)) {
          if (chunk.type === 'chunk' && chunk.isEntry) {
            collect(chunk)
          }
        }
        // Now collect the dynamic chunks, this is done last to have the styles overwrite the previous ones
        for (const chunkName of dynamicImports) {
          collect(bundle[chunkName])
        }

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

        // When running in watch mode the generateBundle is called once per output format
        // in this case the `bundle` is not populated with the other output files
        // but they are still in `pureCssChunks`.
        // So we need to filter the names and only use those who are defined
        const pureCssChunkNames = [...pureCssChunks]
          .map((pureCssChunk) => prelimaryNameToChunkMap[pureCssChunk.fileName])
          .filter(Boolean)

        const replaceEmptyChunk = getEmptyChunkReplacer(
          pureCssChunkNames,
          opts.format,
        )

        for (const file in bundle) {
          const chunk = bundle[file]
          if (chunk.type === 'chunk') {
            let chunkImportsPureCssChunk = false
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
                chunkImportsPureCssChunk = true
                return false
              }
              return true
            })
            if (chunkImportsPureCssChunk) {
              chunk.code = replaceEmptyChunk(chunk.code)
            }
          }
        }

        const removedPureCssFiles = removedPureCssFilesCache.get(config)!
        pureCssChunkNames.forEach((fileName) => {
          removedPureCssFiles.set(fileName, bundle[fileName] as RenderedChunk)
          delete bundle[fileName]
          delete bundle[`${fileName}.map`]
        })
      }

      const cssAssets = Object.values(bundle).filter(
        (asset): asset is OutputAsset =>
          asset.type === 'asset' && asset.fileName.endsWith('.css'),
      )
      for (const cssAsset of cssAssets) {
        if (typeof cssAsset.source === 'string') {
          cssAsset.source = cssAsset.source.replace(viteHashUpdateMarkerRE, '')
        }
      }
    },
  }
}

export function cssAnalysisPlugin(config: ResolvedConfig): Plugin {
  return {
    name: 'vite:css-analysis',

    async transform(_, id) {
      if (
        !isCSSRequest(id) ||
        commonjsProxyRE.test(id) ||
        SPECIAL_QUERY_RE.test(id)
      ) {
        return
      }

      const { moduleGraph } = this.environment as DevEnvironment
      const thisModule = moduleGraph.getModuleById(id)

      // Handle CSS @import dependency HMR and other added modules via this.addWatchFile.
      // JS-related HMR is handled in the import-analysis plugin.
      if (thisModule) {
        // CSS modules cannot self-accept since it exports values
        const isSelfAccepting =
          !cssModulesCache.get(config)?.get(id) &&
          !inlineRE.test(id) &&
          !htmlProxyRE.test(id)
        // attached by pluginContainer.addWatchFile
        const pluginImports = (this as unknown as TransformPluginContext)
          ._addedImports
        if (pluginImports) {
          // record deps in the module graph so edits to @import css can trigger
          // main import to hot update
          const depModules = new Set<string | EnvironmentModuleNode>()
          for (const file of pluginImports) {
            depModules.add(
              isCSSRequest(file)
                ? moduleGraph.createFileOnlyEntry(file)
                : await moduleGraph.ensureEntryFromUrl(
                    fileToDevUrl(file, config, /* skipBase */ true),
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
          )
        } else {
          thisModule.isSelfAccepting = isSelfAccepting
        }
      }
    },
  }
}

/**
 * Create a replacer function that takes code and replaces given pure CSS chunk imports
 * @param pureCssChunkNames The chunks that only contain pure CSS and should be replaced
 * @param outputFormat The module output format to decide whether to replace `import` or `require`
 */
export function getEmptyChunkReplacer(
  pureCssChunkNames: string[],
  outputFormat: ModuleFormat,
): (code: string) => string {
  const emptyChunkFiles = pureCssChunkNames
    .map((file) => path.basename(file))
    .join('|')
    .replace(/\./g, '\\.')

  // for cjs, require calls might be chained by minifier using the comma operator.
  // in this case we have to keep one comma if a next require is chained
  // or add a semicolon to terminate the chain.
  const emptyChunkRE = new RegExp(
    outputFormat === 'es'
      ? `\\bimport\\s*["'][^"']*(?:${emptyChunkFiles})["'];`
      : `(\\b|,\\s*)require\\(\\s*["'][^"']*(?:${emptyChunkFiles})["']\\)(;|,)`,
    'g',
  )

  return (code: string) =>
    code.replace(
      emptyChunkRE,
      // remove css import while preserving source map location
      (m) =>
        outputFormat === 'es'
          ? `/* empty css ${''.padEnd(m.length - 15)}*/`
          : `${m.at(-1)}/* empty css ${''.padEnd(m.length - 16)}*/`,
    )
}

interface CSSAtImportResolvers {
  css: ResolveIdFn
  sass: ResolveIdFn
  less: ResolveIdFn
}

function createCSSResolvers(config: ResolvedConfig): CSSAtImportResolvers {
  let cssResolve: ResolveIdFn | undefined
  let sassResolve: ResolveIdFn | undefined
  let lessResolve: ResolveIdFn | undefined
  return {
    get css() {
      return (cssResolve ??= createBackCompatIdResolver(config, {
        extensions: ['.css'],
        mainFields: ['style'],
        conditions: ['style'],
        tryIndex: false,
        preferRelative: true,
      }))
    },

    get sass() {
      if (!sassResolve) {
        const resolver = createBackCompatIdResolver(config, {
          extensions: ['.scss', '.sass', '.css'],
          mainFields: ['sass', 'style'],
          conditions: ['sass', 'style'],
          tryIndex: true,
          tryPrefix: '_',
          preferRelative: true,
        })
        sassResolve = async (...args) => {
          if (args[1].startsWith('file://')) {
            args[1] = fileURLToPath(args[1])
          }
          return resolver(...args)
        }
      }
      return sassResolve
    },

    get less() {
      return (lessResolve ??= createBackCompatIdResolver(config, {
        extensions: ['.less', '.css'],
        mainFields: ['less', 'style'],
        conditions: ['less', 'style'],
        tryIndex: false,
        preferRelative: true,
      }))
    },
  }
}

function getCssResolversKeys(
  resolvers: CSSAtImportResolvers,
): Array<keyof CSSAtImportResolvers> {
  return Object.keys(resolvers) as unknown as Array<keyof CSSAtImportResolvers>
}

async function compileCSSPreprocessors(
  environment: PartialEnvironment,
  id: string,
  lang: PreprocessLang,
  code: string,
  workerController: PreprocessorWorkerController,
): Promise<{ code: string; map?: ExistingRawSourceMap; deps?: Set<string> }> {
  const { config } = environment
  const { preprocessorOptions, devSourcemap } = config.css ?? {}
  const atImportResolvers = getAtImportResolvers(
    environment.getTopLevelConfig(),
  )
  const opts = {
    ...((preprocessorOptions && preprocessorOptions[lang]) || {}),
    alias: config.resolve.alias,
    // important: set this for relative import resolving
    filename: cleanUrl(id),
    enableSourcemap: devSourcemap ?? false,
  }

  const preProcessor = workerController[lang]
  const preprocessResult = await preProcessor(
    environment,
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
  environment: PartialEnvironment,
  id: string,
  code: string,
  workerController: PreprocessorWorkerController,
  urlReplacer?: CssUrlReplacer,
): Promise<{
  code: string
  map?: SourceMapInput
  ast?: PostCSS.Result
  modules?: Record<string, string>
  deps?: Set<string>
}> {
  const { config } = environment
  if (config.css?.transformer === 'lightningcss') {
    return compileLightningCSS(id, code, environment, urlReplacer)
  }

  const { modules: modulesOptions, devSourcemap } = config.css || {}
  const isModule = modulesOptions !== false && cssModuleRE.test(id)
  // although at serve time it can work without processing, we do need to
  // crawl them in order to register watch dependencies.
  const needInlineImport = code.includes('@import')
  const hasUrl = cssUrlRE.test(code) || cssImageSetRE.test(code)
  const lang = CSS_LANGS_RE.exec(id)?.[1] as CssLang | undefined
  const postcssConfig = await resolvePostcssConfig(
    environment.getTopLevelConfig(),
  )

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
      environment,
      id,
      lang,
      code,
      workerController,
    )
    code = preprocessorResult.code
    preprocessorMap = preprocessorResult.map
    preprocessorResult.deps?.forEach((dep) => deps.add(dep))
  }

  // 3. postcss
  const atImportResolvers = getAtImportResolvers(
    environment.getTopLevelConfig(),
  )
  const postcssOptions = (postcssConfig && postcssConfig.options) || {}

  const postcssPlugins =
    postcssConfig && postcssConfig.plugins ? postcssConfig.plugins.slice() : []

  if (needInlineImport) {
    postcssPlugins.unshift(
      (await importPostcssImport()).default({
        async resolve(id, basedir) {
          const publicFile = checkPublicFile(
            id,
            environment.getTopLevelConfig(),
          )
          if (publicFile) {
            return publicFile
          }

          const resolved = await atImportResolvers.css(
            environment,
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
            environment.logger.error(
              colors.red(
                `Unable to resolve \`@import "${id}"\` from ${basedir}`,
              ),
            )
          }

          return id
        },
        async load(id) {
          const code = await fs.promises.readFile(id, 'utf-8')
          const lang = CSS_LANGS_RE.exec(id)?.[1] as CssLang | undefined
          if (isPreProcessor(lang)) {
            const result = await compileCSSPreprocessors(
              environment,
              id,
              lang,
              code,
              workerController,
            )
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
        logger: environment.logger,
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
            const resolved = await atImportResolvers[key](
              environment,
              id,
              importer,
            )
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
      parser: lang === 'sss' ? loadSss(config.root) : postcssOptions.parser,
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
        const files = globSync(globPattern, {
          absolute: true,
          cwd: path.resolve(path.dirname(id), dir),
          expandDirectories: false,
          ignore: ['**/node_modules/**'],
        })
        for (let i = 0; i < files.length; i++) {
          deps.add(files[i])
        }
      } else if (message.type === 'warning') {
        const warning = message as PostCSS.Warning
        let msg = `[vite:css] ${warning.text}`
        msg += `\n${generateCodeFrame(
          code,
          {
            line: warning.line,
            column: warning.column - 1, // 1-based
          },
          warning.endLine !== undefined && warning.endColumn !== undefined
            ? {
                line: warning.endLine,
                column: warning.endColumn - 1, // 1-based
              }
            : undefined,
        )}`
        environment.logger.warn(colors.yellow(msg))
      }
    }
  } catch (e) {
    e.message = `[postcss] ${e.message}`
    e.code = code
    e.loc = {
      file: e.file,
      line: e.line,
      column: e.column - 1, // 1-based
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

const preprocessorWorkerControllerCache = new WeakMap<
  ResolvedConfig,
  PreprocessorWorkerController
>()
let alwaysFakeWorkerWorkerControllerCache:
  | PreprocessorWorkerController
  | undefined

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
  let workerController = preprocessorWorkerControllerCache.get(config)

  if (!workerController) {
    // if workerController doesn't exist, create a workerController that always uses fake workers
    // because fake workers doesn't require calling `.close` unlike real workers
    alwaysFakeWorkerWorkerControllerCache ||=
      createPreprocessorWorkerController(0)
    workerController = alwaysFakeWorkerWorkerControllerCache
  }

  // `preprocessCSS` is hardcoded to use the client environment.
  // Since CSS is usually only consumed by the client, and the server builds need to match
  // the client asset chunk name to deduplicate the link reference, this may be fine in most
  // cases. We should revisit in the future if there's a case to preprocess CSS based on a
  // different environment instance.
  const environment: PartialEnvironment = new PartialEnvironment(
    'client',
    config,
  )

  return await compileCSS(environment, filename, code, workerController)
}

export async function formatPostcssSourceMap(
  rawMap: ExistingRawSourceMap,
  file: string,
): Promise<ExistingRawSourceMap> {
  const inputFileDir = path.dirname(file)

  const sources = rawMap.sources.map((source) => {
    const cleanSource = cleanUrl(decodeURIComponent(source))

    // postcss virtual files
    if (cleanSource[0] === '<' && cleanSource[cleanSource.length - 1] === '>') {
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

const viteHashUpdateMarker = '/*$vite$:1*/'
const viteHashUpdateMarkerRE = /\/\*\$vite\$:\d+\*\//

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
  // inject an additional string to generate a different hash for https://github.com/vitejs/vite/issues/18038
  //
  // pre-5.4.3, we generated CSS link tags without crossorigin attribute and generated an hash without
  // this string
  // in 5.4.3, we added crossorigin attribute to the generated CSS link tags but that made chromium browsers
  // to block the CSSs from loading due to chromium's weird behavior
  // (https://www.hacksoft.io/blog/handle-images-cors-error-in-chrome, https://issues.chromium.org/issues/40381978)
  // to avoid that happening, we inject an additional string so that a different hash is generated
  // for the same CSS content
  css += viteHashUpdateMarker
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
      if (!e.message.includes('No PostCSS Config found')) {
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
const cssImageSetRE = /(?<=image-set\()((?:[\w-]{1,256}\([^)]*\)|[^)])*)(?=\))/

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
    functionCallRE.test(rawUrl)
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

  let newUrl = await replacer(rawUrl)
  // The new url might need wrapping even if the original did not have it, e.g. if a space was added during replacement
  if (wrap === '' && newUrl !== encodeURI(newUrl)) {
    wrap = '"'
  }
  // If wrapping in single quotes and newUrl also contains single quotes, switch to double quotes.
  // Give preference to double quotes since SVG inlining converts double quotes to single quotes.
  if (wrap === "'" && newUrl.includes("'")) {
    wrap = '"'
  }
  // Escape double quotes if they exist (they also tend to be rarer than single quotes)
  if (wrap === '"' && newUrl.includes('"')) {
    newUrl = newUrl.replace(nonEscapedDoubleQuoteRe, '\\"')
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

    // NodeJS res.code = Buffer
    // Deno res.code = Uint8Array
    // For correct decode compiled css need to use TextDecoder
    // LightningCSS output does not return a linebreak at the end
    return decoder.decode(code) + (inlined ? '' : '\n')
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

const atImportRE =
  /@import(?:\s*(?:url\([^)]*\)|"(?:[^"]|(?<=\\)")*"|'(?:[^']|(?<=\\)')*').*?|[^;]*);/g
const atCharsetRE =
  /@charset(?:\s*(?:"(?:[^"]|(?<=\\)")*"|'(?:[^']|(?<=\\)')*').*?|[^;]*);/g

export async function hoistAtRules(css: string): Promise<string> {
  const s = new MagicString(css)
  const cleanCss = emptyCssComments(css)
  let match: RegExpExecArray | null

  // #1845
  // CSS @import can only appear at top of the file. We need to hoist all @import
  // to top when multiple files are concatenated.
  // match until semicolon that's not in quotes
  atImportRE.lastIndex = 0
  while ((match = atImportRE.exec(cleanCss))) {
    s.remove(match.index, match.index + match[0].length)
    // Use `appendLeft` instead of `prepend` to preserve original @import order
    s.appendLeft(0, match[0])
  }

  // #6333
  // CSS @charset must be the top-first in the file, hoist the first to top
  atCharsetRE.lastIndex = 0
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

type SassPreprocessorOptions = {
  additionalData?: PreprocessorAdditionalData
} & (
  | ({ api?: 'legacy' } & SassLegacyPreprocessBaseOptions)
  | ({ api: 'modern' | 'modern-compiler' } & SassModernPreprocessBaseOptions)
)

type LessPreprocessorOptions = {
  additionalData?: PreprocessorAdditionalData
} & LessPreprocessorBaseOptions

type StylusPreprocessorOptions = {
  additionalData?: PreprocessorAdditionalData
} & StylusPreprocessorBaseOptions

type StylePreprocessorInternalOptions = {
  maxWorkers?: number | true
  filename: string
  alias: Alias[]
  enableSourcemap: boolean
}

type SassStylePreprocessorInternalOptions = StylePreprocessorInternalOptions &
  SassPreprocessorOptions

type LessStylePreprocessorInternalOptions = StylePreprocessorInternalOptions &
  LessPreprocessorOptions

type StylusStylePreprocessorInternalOptions = StylePreprocessorInternalOptions &
  StylusPreprocessorOptions

type StylePreprocessor<Options extends StylePreprocessorInternalOptions> = {
  process: (
    environment: PartialEnvironment,
    source: string,
    root: string,
    options: Options,
    resolvers: CSSAtImportResolvers,
  ) => StylePreprocessorResults | Promise<StylePreprocessorResults>
  close: () => void
}

export interface StylePreprocessorResults {
  code: string
  map?: ExistingRawSourceMap | undefined
  additionalMap?: ExistingRawSourceMap | undefined
  error?: RollupError
  deps: string[]
}

const loadedPreprocessorPath: Partial<
  Record<PreprocessLang | PostCssDialectLang | 'sass-embedded', string>
> = {}

function loadPreprocessorPath(
  lang: PreprocessLang | PostCssDialectLang | 'sass-embedded',
  root: string,
): string {
  const cached = loadedPreprocessorPath[lang]
  if (cached) {
    return cached
  }
  try {
    const resolved = requireResolveFromRootWithFallback(root, lang)
    return (loadedPreprocessorPath[lang] = resolved)
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

function loadSassPackage(root: string): {
  name: 'sass' | 'sass-embedded'
  path: string
} {
  // try sass-embedded before sass
  try {
    const path = loadPreprocessorPath('sass-embedded', root)
    return { name: 'sass-embedded', path }
  } catch (e1) {
    try {
      const path = loadPreprocessorPath(PreprocessLang.sass, root)
      return { name: 'sass', path }
    } catch {
      throw e1
    }
  }
}

let cachedSss: any
function loadSss(root: string) {
  if (cachedSss) return cachedSss

  const sssPath = loadPreprocessorPath(PostCssDialectLang.sss, root)
  cachedSss = createRequire(import.meta.url)(sssPath)
  return cachedSss
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
  data: Sass.LegacyImporterResult,
): Sass.LegacyImporterResult {
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

// #region Sass
// .scss/.sass processor
const makeScssWorker = (
  environment: PartialEnvironment,
  resolvers: CSSAtImportResolvers,
  alias: Alias[],
  maxWorkers: number | undefined,
  packageName: 'sass' | 'sass-embedded',
) => {
  const internalImporter = async (
    url: string,
    importer: string,
    filename: string,
  ) => {
    importer = cleanScssBugUrl(importer)
    const resolved = await resolvers.sass(environment, url, importer)
    if (resolved) {
      try {
        const data = await rebaseUrls(
          environment,
          resolved,
          filename,
          alias,
          '$',
          resolvers.sass,
        )
        if (packageName === 'sass-embedded') {
          return data
        }
        return fixScssBugImportValue(data)
      } catch (data) {
        return data
      }
    } else {
      return null
    }
  }

  const worker = new WorkerWithFallback(
    () =>
      async (
        sassPath: string,
        data: string,
        // additionalData can a function that is not cloneable but it won't be used
        options: SassStylePreprocessorInternalOptions & {
          api: 'legacy'
          additionalData: undefined
        },
      ) => {
        // eslint-disable-next-line no-restricted-globals -- this function runs inside a cjs worker
        const sass: typeof Sass = require(sassPath)
        // eslint-disable-next-line no-restricted-globals
        const path: typeof import('node:path') = require('node:path')

        // NOTE: `sass` always runs it's own importer first, and only falls back to
        // the `importer` option when it can't resolve a path
        const _internalImporter: Sass.LegacyAsyncImporter = (
          url,
          importer,
          done,
        ) => {
          internalImporter(url, importer, options.filename).then((data) =>
            done?.(data),
          )
        }
        const importer = [_internalImporter]
        if (options.importer) {
          if (Array.isArray(options.importer)) {
            importer.unshift(...options.importer)
          } else {
            importer.unshift(options.importer)
          }
        }

        const finalOptions: Sass.LegacyOptions<'async'> = {
          // support @import from node dependencies by default
          includePaths: ['node_modules'],
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
        return new Promise<ScssWorkerResult>((resolve, reject) => {
          sass.render(finalOptions, (err, res) => {
            if (err) {
              reject(err)
            } else {
              resolve({
                css: res!.css.toString(),
                map: res!.map?.toString(),
                stats: res!.stats,
              })
            }
          })
        })
      },
    {
      parentFunctions: { internalImporter },
      shouldUseFake(_sassPath, _data, options) {
        // functions and importer is a function and is not serializable
        // in that case, fallback to running in main thread
        return !!(
          (options.functions && Object.keys(options.functions).length > 0) ||
          (options.importer &&
            (!Array.isArray(options.importer) ||
              options.importer.length > 0)) ||
          options.logger ||
          options.pkgImporter
        )
      },
      max: maxWorkers,
    },
  )
  return worker
}

const makeModernScssWorker = (
  environment: PartialEnvironment,
  resolvers: CSSAtImportResolvers,
  alias: Alias[],
  maxWorkers: number | undefined,
) => {
  const internalCanonicalize = async (
    url: string,
    importer: string,
  ): Promise<string | null> => {
    importer = cleanScssBugUrl(importer)
    const resolved = await resolvers.sass(environment, url, importer)
    return resolved ?? null
  }

  const internalLoad = async (file: string, rootFile: string) => {
    const result = await rebaseUrls(
      environment,
      file,
      rootFile,
      alias,
      '$',
      resolvers.sass,
    )
    if (result.contents) {
      return result.contents
    }
    return await fsp.readFile(result.file, 'utf-8')
  }

  const worker = new WorkerWithFallback(
    () =>
      async (
        sassPath: string,
        data: string,
        // additionalData can a function that is not cloneable but it won't be used
        options: SassStylePreprocessorInternalOptions & {
          api: 'modern'
          additionalData: undefined
        },
      ) => {
        // eslint-disable-next-line no-restricted-globals -- this function runs inside a cjs worker
        const sass: typeof Sass = require(sassPath)
        // eslint-disable-next-line no-restricted-globals
        const path: typeof import('node:path') = require('node:path')

        const { fileURLToPath, pathToFileURL }: typeof import('node:url') =
          // eslint-disable-next-line no-restricted-globals
          require('node:url')

        const sassOptions = { ...options } as Sass.StringOptions<'async'>
        sassOptions.url = pathToFileURL(options.filename)
        sassOptions.sourceMap = options.enableSourcemap

        const internalImporter: Sass.Importer<'async'> = {
          async canonicalize(url, context) {
            const importer = context.containingUrl
              ? fileURLToPath(context.containingUrl)
              : options.filename
            const resolved = await internalCanonicalize(url, importer)
            return resolved ? pathToFileURL(resolved) : null
          },
          async load(canonicalUrl) {
            const ext = path.extname(canonicalUrl.pathname)
            let syntax: Sass.Syntax = 'scss'
            if (ext === '.sass') {
              syntax = 'indented'
            } else if (ext === '.css') {
              syntax = 'css'
            }
            const contents = await internalLoad(
              fileURLToPath(canonicalUrl),
              options.filename,
            )
            return { contents, syntax, sourceMapUrl: canonicalUrl }
          },
        }
        sassOptions.importers = [
          ...(sassOptions.importers ?? []),
          internalImporter,
        ]

        const result = await sass.compileStringAsync(data, sassOptions)
        return {
          css: result.css,
          map: result.sourceMap ? JSON.stringify(result.sourceMap) : undefined,
          stats: {
            includedFiles: result.loadedUrls
              .filter((url) => url.protocol === 'file:')
              .map((url) => fileURLToPath(url)),
          },
        } satisfies ScssWorkerResult
      },
    {
      parentFunctions: {
        internalCanonicalize,
        internalLoad,
      },
      shouldUseFake(_sassPath, _data, options) {
        // functions and importer is a function and is not serializable
        // in that case, fallback to running in main thread
        return !!(
          (options.functions && Object.keys(options.functions).length > 0) ||
          (options.importers &&
            (!Array.isArray(options.importers) ||
              options.importers.length > 0)) ||
          options.logger
        )
      },
      max: maxWorkers,
    },
  )
  return worker
}

// this is mostly a copy&paste of makeModernScssWorker
// however sharing code between two is hard because
// makeModernScssWorker above needs function inlined for worker.
const makeModernCompilerScssWorker = (
  environment: PartialEnvironment,
  resolvers: CSSAtImportResolvers,
  alias: Alias[],
  _maxWorkers: number | undefined,
) => {
  let compilerPromise: Promise<Sass.AsyncCompiler> | undefined

  const worker: Awaited<ReturnType<typeof makeModernScssWorker>> = {
    async run(sassPath, data, options) {
      // need pathToFileURL for windows since import("D:...") fails
      // https://github.com/nodejs/node/issues/31710
      const sass: typeof Sass = (await import(pathToFileURL(sassPath).href))
        .default
      compilerPromise ??= sass.initAsyncCompiler()
      const compiler = await compilerPromise

      const sassOptions = { ...options } as Sass.StringOptions<'async'>
      sassOptions.url = pathToFileURL(options.filename)
      sassOptions.sourceMap = options.enableSourcemap

      const internalImporter: Sass.Importer<'async'> = {
        async canonicalize(url, context) {
          const importer = context.containingUrl
            ? fileURLToPath(context.containingUrl)
            : options.filename
          const resolved = await resolvers.sass(
            environment,
            url,
            cleanScssBugUrl(importer),
          )
          return resolved ? pathToFileURL(resolved) : null
        },
        async load(canonicalUrl) {
          const ext = path.extname(canonicalUrl.pathname)
          let syntax: Sass.Syntax = 'scss'
          if (ext === '.sass') {
            syntax = 'indented'
          } else if (ext === '.css') {
            syntax = 'css'
          }
          const result = await rebaseUrls(
            environment,
            fileURLToPath(canonicalUrl),
            options.filename,
            alias,
            '$',
            resolvers.sass,
          )
          const contents =
            result.contents ?? (await fsp.readFile(result.file, 'utf-8'))
          return { contents, syntax, sourceMapUrl: canonicalUrl }
        },
      }
      sassOptions.importers = [
        ...(sassOptions.importers ?? []),
        internalImporter,
      ]

      const result = await compiler.compileStringAsync(data, sassOptions)
      return {
        css: result.css,
        map: result.sourceMap ? JSON.stringify(result.sourceMap) : undefined,
        stats: {
          includedFiles: result.loadedUrls
            .filter((url) => url.protocol === 'file:')
            .map((url) => fileURLToPath(url)),
        },
      } satisfies ScssWorkerResult
    },
    async stop() {
      ;(await compilerPromise)?.dispose()
      compilerPromise = undefined
    },
  }

  return worker
}

type ScssWorkerResult = {
  css: string
  map?: string | undefined
  stats: Pick<Sass.LegacyResult['stats'], 'includedFiles'>
}

const scssProcessor = (
  maxWorkers: number | undefined,
): StylePreprocessor<SassStylePreprocessorInternalOptions> => {
  const workerMap = new Map<
    unknown,
    ReturnType<
      | typeof makeScssWorker
      | typeof makeModernScssWorker
      | typeof makeModernCompilerScssWorker
    >
  >()

  return {
    close() {
      for (const worker of workerMap.values()) {
        worker.stop()
      }
    },
    async process(environment, source, root, options, resolvers) {
      const sassPackage = loadSassPackage(root)
      // TODO: change default in v6
      // options.api ?? sassPackage.name === "sass-embedded" ? "modern-compiler" : "modern";
      const api = options.api ?? 'legacy'

      if (!workerMap.has(options.alias)) {
        workerMap.set(
          options.alias,
          api === 'modern-compiler'
            ? makeModernCompilerScssWorker(
                environment,
                resolvers,
                options.alias,
                maxWorkers,
              )
            : api === 'modern'
              ? makeModernScssWorker(
                  environment,
                  resolvers,
                  options.alias,
                  maxWorkers,
                )
              : makeScssWorker(
                  environment,
                  resolvers,
                  options.alias,
                  maxWorkers,
                  sassPackage.name,
                ),
        )
      }
      const worker = workerMap.get(options.alias)!

      const { content: data, map: additionalMap } = await getSource(
        source,
        options.filename,
        options.additionalData,
        options.enableSourcemap,
      )

      const optionsWithoutAdditionalData = {
        ...options,
        additionalData: undefined,
      }
      try {
        const result = await worker.run(
          sassPackage.path,
          data,
          // @ts-expect-error the correct worker is selected for `options.type`
          optionsWithoutAdditionalData,
        )
        const deps = result.stats.includedFiles.map((f) => cleanScssBugUrl(f))
        const map: ExistingRawSourceMap | undefined = result.map
          ? JSON.parse(result.map.toString())
          : undefined

        if (map) {
          map.sources = map.sources.map((url) =>
            url.startsWith('file://') ? normalizePath(fileURLToPath(url)) : url,
          )
        }

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
    },
  }
}
// #endregion

/**
 * relative url() inside \@imported sass and less files must be rebased to use
 * root file as base.
 */
async function rebaseUrls(
  environment: PartialEnvironment,
  file: string,
  rootFile: string,
  alias: Alias[],
  variablePrefix: string,
  resolver: ResolveIdFn,
): Promise<{ file: string; contents?: string }> {
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
  const rebaseFn = async (url: string) => {
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
    const absolute =
      (await resolver(environment, url, file)) || path.resolve(fileDir, url)
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

// #region Less
// .less
const makeLessWorker = (
  environment: PartialEnvironment,
  resolvers: CSSAtImportResolvers,
  alias: Alias[],
  maxWorkers: number | undefined,
) => {
  const viteLessResolve = async (
    filename: string,
    dir: string,
    rootFile: string,
  ) => {
    const resolved = await resolvers.less(
      environment,
      filename,
      path.join(dir, '*'),
    )
    if (!resolved) return undefined

    const result = await rebaseUrls(
      environment,
      resolved,
      rootFile,
      alias,
      '@',
      resolvers.less,
    )
    if (result) {
      return {
        resolved,
        contents: 'contents' in result ? result.contents : undefined,
      }
    }
    return result
  }

  const worker = new WorkerWithFallback(
    () => {
      // eslint-disable-next-line no-restricted-globals -- this function runs inside a cjs worker
      const fsp = require('node:fs/promises')
      // eslint-disable-next-line no-restricted-globals
      const path = require('node:path')

      let ViteLessManager: any
      const createViteLessPlugin = (
        less: typeof Less,
        rootFile: string,
      ): Less.Plugin => {
        const { FileManager } = less
        ViteLessManager ??= class ViteManager extends FileManager {
          rootFile
          constructor(rootFile: string) {
            super()
            this.rootFile = rootFile
          }
          override supports(filename: string) {
            return !/^(?:https?:)?\/\//.test(filename)
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
            const result = await viteLessResolve(filename, dir, this.rootFile)
            if (result) {
              return {
                filename: path.resolve(result.resolved),
                contents:
                  result.contents ??
                  (await fsp.readFile(result.resolved, 'utf-8')),
              }
            } else {
              return super.loadFile(filename, dir, opts, env)
            }
          }
        }

        return {
          install(_, pluginManager) {
            pluginManager.addFileManager(new ViteLessManager(rootFile))
          },
          minVersion: [3, 0, 0],
        }
      }

      return async (
        lessPath: string,
        content: string,
        // additionalData can a function that is not cloneable but it won't be used
        options: LessStylePreprocessorInternalOptions & {
          additionalData: undefined
        },
      ) => {
        // eslint-disable-next-line no-restricted-globals -- this function runs inside a cjs worker
        const nodeLess: typeof Less = require(lessPath)
        const viteResolverPlugin = createViteLessPlugin(
          nodeLess,
          options.filename,
        )
        const result = await nodeLess.render(content, {
          // support @import from node dependencies by default
          paths: ['node_modules'],
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
        return result
      }
    },
    {
      parentFunctions: { viteLessResolve },
      shouldUseFake(_lessPath, _content, options) {
        // plugins are a function and is not serializable
        // in that case, fallback to running in main thread
        return !!options.plugins && options.plugins.length > 0
      },
      max: maxWorkers,
    },
  )
  return worker
}

const lessProcessor = (
  maxWorkers: number | undefined,
): StylePreprocessor<LessStylePreprocessorInternalOptions> => {
  const workerMap = new Map<unknown, ReturnType<typeof makeLessWorker>>()

  return {
    close() {
      for (const worker of workerMap.values()) {
        worker.stop()
      }
    },
    async process(environment, source, root, options, resolvers) {
      const lessPath = loadPreprocessorPath(PreprocessLang.less, root)

      if (!workerMap.has(options.alias)) {
        workerMap.set(
          options.alias,
          makeLessWorker(environment, resolvers, options.alias, maxWorkers),
        )
      }
      const worker = workerMap.get(options.alias)!

      const { content, map: additionalMap } = await getSource(
        source,
        options.filename,
        options.additionalData,
        options.enableSourcemap,
      )

      let result: Less.RenderOutput | undefined
      const optionsWithoutAdditionalData = {
        ...options,
        additionalData: undefined,
      }
      try {
        result = await worker.run(
          lessPath,
          content,
          optionsWithoutAdditionalData,
        )
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
    },
  }
}
// #endregion

// #region Stylus
// .styl
const makeStylWorker = (maxWorkers: number | undefined) => {
  const worker = new WorkerWithFallback(
    () => {
      return async (
        stylusPath: string,
        content: string,
        root: string,
        // additionalData can a function that is not cloneable but it won't be used
        options: StylusStylePreprocessorInternalOptions & {
          additionalData: undefined
        },
      ) => {
        // eslint-disable-next-line no-restricted-globals -- this function runs inside a cjs worker
        const nodeStylus: typeof Stylus = require(stylusPath)

        const ref = nodeStylus(content, {
          // support @import from node dependencies by default
          paths: ['node_modules'],
          ...options,
        })
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

        return {
          code: ref.render(),
          // @ts-expect-error sourcemap exists
          map: ref.sourcemap as ExistingRawSourceMap | undefined,
          deps: ref.deps(),
        }
      }
    },
    {
      shouldUseFake(_stylusPath, _content, _root, options) {
        // define can include functions and those are not serializable
        // in that case, fallback to running in main thread
        return !!(
          options.define &&
          Object.values(options.define).some((d) => typeof d === 'function')
        )
      },
      max: maxWorkers,
    },
  )
  return worker
}

const stylProcessor = (
  maxWorkers: number | undefined,
): StylePreprocessor<StylusStylePreprocessorInternalOptions> => {
  const workerMap = new Map<unknown, ReturnType<typeof makeStylWorker>>()

  return {
    close() {
      for (const worker of workerMap.values()) {
        worker.stop()
      }
    },
    async process(_environment, source, root, options, _resolvers) {
      const stylusPath = loadPreprocessorPath(PreprocessLang.stylus, root)

      if (!workerMap.has(options.alias)) {
        workerMap.set(options.alias, makeStylWorker(maxWorkers))
      }
      const worker = workerMap.get(options.alias)!

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
      const optionsWithoutAdditionalData = {
        ...options,
        additionalData: undefined,
      }
      try {
        const { code, map, deps } = await worker.run(
          stylusPath,
          content,
          root,
          optionsWithoutAdditionalData,
        )
        return {
          code,
          map: formatStylusSourceMap(map, root),
          additionalMap,
          // Concat imports deps with computed deps
          deps: [...deps, ...importsDeps],
        }
      } catch (e) {
        const wrapped = new Error(`[stylus] ${e.message}`)
        wrapped.name = e.name
        wrapped.stack = e.stack
        return { code: '', error: wrapped, deps: [] }
      }
    },
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
// #endregion

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

const createPreprocessorWorkerController = (maxWorkers: number | undefined) => {
  const scss = scssProcessor(maxWorkers)
  const less = lessProcessor(maxWorkers)
  const styl = stylProcessor(maxWorkers)

  const sassProcess: StylePreprocessor<SassStylePreprocessorInternalOptions>['process'] =
    (environment, source, root, options, resolvers) => {
      let opts: SassStylePreprocessorInternalOptions
      if (options.api === 'modern' || options.api === 'modern-compiler') {
        opts = { ...options, syntax: 'indented' as const }
      } else {
        const narrowedOptions =
          options as SassStylePreprocessorInternalOptions & {
            api?: 'legacy'
          }
        opts = {
          ...narrowedOptions,
          indentedSyntax: true,
        }
      }
      return scss.process(environment, source, root, opts, resolvers)
    }

  const close = () => {
    less.close()
    scss.close()
    styl.close()
  }

  return {
    [PreprocessLang.less]: less.process,
    [PreprocessLang.scss]: scss.process,
    [PreprocessLang.sass]: sassProcess,
    [PreprocessLang.styl]: styl.process,
    [PreprocessLang.stylus]: styl.process,
    close,
  } as const satisfies { [K in PreprocessLang | 'close']: unknown }
}

const normalizeMaxWorkers = (maxWorker: number | true | undefined) => {
  if (maxWorker === undefined) return 0
  if (maxWorker === true) return undefined
  return maxWorker
}

type PreprocessorWorkerController = ReturnType<
  typeof createPreprocessorWorkerController
>

const preprocessorSet = new Set([
  PreprocessLang.less,
  PreprocessLang.sass,
  PreprocessLang.scss,
  PreprocessLang.styl,
  PreprocessLang.stylus,
] as const)

function isPreProcessor(lang: any): lang is PreprocessLang {
  return lang && preprocessorSet.has(lang)
}

const importLightningCSS = createCachedImport(() => import('lightningcss'))
async function compileLightningCSS(
  id: string,
  src: string,
  environment: PartialEnvironment,
  urlReplacer?: CssUrlReplacer,
): ReturnType<typeof compileCSS> {
  const { config } = environment
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
            const publicFile = checkPublicFile(
              id,
              environment.getTopLevelConfig(),
            )
            if (publicFile) {
              return publicFile
            }

            const resolved = await getAtImportResolvers(
              environment.getTopLevelConfig(),
            ).css(environment, id, toAbsolute(from))

            if (resolved) {
              deps.add(resolved)
              return resolved
            }
            return id
          },
        },
        minify: config.isProduction && !!config.build.cssMinify,
        sourceMap:
          config.command === 'build'
            ? !!config.build.sourcemap
            : config.css?.devSourcemap,
        analyzeDependencies: true,
        cssModules: cssModuleRE.test(id)
          ? (config.css?.lightningcss?.cssModules ?? true)
          : undefined,
      })

  // NodeJS res.code = Buffer
  // Deno res.code = Uint8Array
  // For correct decode compiled css need to use TextDecoder
  let css = decoder.decode(res.code)
  for (const dep of res.dependencies!) {
    switch (dep.type) {
      case 'url':
        if (skipUrlReplacer(dep.url)) {
          css = css.replace(dep.placeholder, () => dep.url)
          break
        }
        deps.add(dep.url)
        if (urlReplacer) {
          const replaceUrl = await urlReplacer(
            dep.url,
            toAbsolute(dep.loc.filePath),
          )
          css = css.replace(dep.placeholder, () => replaceUrl)
        } else {
          css = css.replace(dep.placeholder, () => dep.url)
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
  // https://caniuse.com/?search=es2023
  2023: ['chrome110', 'edge110', 'safari16.4', 'opera96'],
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
    const match = esRE.exec(e)
    if (!match) return e
    const year = Number(match[1])
    if (!esMap[year]) throw new Error(`Unsupported target "${e}"`)
    return esMap[year]
  })

  for (const entry of entriesWithoutES) {
    if (entry === 'esnext') continue
    const index = entry.search(versionRE)
    if (index >= 0) {
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
