import path from 'node:path'
import url from 'node:url'
import type {
  TransformOptions as OxcTransformOptions,
  TransformResult as OxcTransformResult,
} from 'rolldown/experimental'
import {
  viteTransformPlugin as nativeTransformPlugin,
  transformSync,
} from 'rolldown/experimental'
import type { RawSourceMap } from '@jridgewell/remapping'
import type { InternalModuleFormat, RollupError, SourceMap } from 'rolldown'
import { rolldown } from 'rolldown'
import { TSConfckParseError } from 'tsconfck'
import colors from 'picocolors'
import { exactRegex, prefixRegex } from 'rolldown/filter'
import type { FSWatcher } from '#dep-types/chokidar'
import {
  combineSourcemaps,
  createFilter,
  ensureWatchedFile,
  generateCodeFrame,
  normalizePath,
} from '../utils'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import { cleanUrl } from '../../shared/utils'
import { type Environment, perEnvironmentPlugin } from '..'
import type { ViteDevServer } from '../server'
import { JS_TYPES_RE, VITE_PACKAGE_DIR } from '../constants'
import type { Logger } from '../logger'
import type { ESBuildOptions, TSCompilerOptions } from './esbuild'
import { loadTsconfigJsonForFile } from './esbuild'

// IIFE content looks like `var MyLib = (function() {`.
export const IIFE_BEGIN_RE: RegExp =
  /(?:(?:const|var)\s+\S+\s*=\s*|^|\n)\(?function\([^()]*\)\s*\{(?:\s*"use strict";)?/
// UMD content looks like `})(this, function(exports, external1, external2) {`.
export const UMD_BEGIN_RE: RegExp =
  /\}\)\((?:this,\s*)?function\([^()]*\)\s*\{(?:\s*"use strict";)?/

const jsxExtensionsRE = /\.(?:j|t)sx\b/
const validExtensionRE = /\.\w+$/

export interface OxcOptions extends Omit<
  OxcTransformOptions,
  'cwd' | 'sourceType' | 'lang' | 'sourcemap' | 'helpers'
> {
  include?: string | RegExp | ReadonlyArray<string | RegExp>
  exclude?: string | RegExp | ReadonlyArray<string | RegExp>
  jsxInject?: string
  jsxRefreshInclude?: string | RegExp | ReadonlyArray<string | RegExp>
  jsxRefreshExclude?: string | RegExp | ReadonlyArray<string | RegExp>
}

export function getRollupJsxPresets(
  preset: 'react' | 'react-jsx',
): OxcJsxOptions {
  switch (preset) {
    case 'react':
      return {
        runtime: 'classic',
        pragma: 'React.createElement',
        pragmaFrag: 'React.Fragment',
        importSource: 'react',
      }
    case 'react-jsx':
      return {
        runtime: 'automatic',
        pragma: 'React.createElement',
        importSource: 'react',
      }
  }
  preset satisfies never
}

function setOxcTransformOptionsFromTsconfigOptions(
  oxcOptions: Omit<OxcTransformOptions, 'jsx'> & {
    jsx?:
      | OxcTransformOptions['jsx']
      | 'react'
      | 'react-jsx'
      | 'preserve-react'
      | false
  },
  tsCompilerOptions: Readonly<TSCompilerOptions> | undefined = {},
  warnings: string[],
): void {
  // when both the normal options and tsconfig is set,
  // we want to prioritize the normal options
  if (oxcOptions.jsx === 'preserve-react') {
    oxcOptions.jsx = 'preserve'
  }
  if (
    tsCompilerOptions.jsx === 'preserve' &&
    (oxcOptions.jsx === undefined ||
      (typeof oxcOptions.jsx === 'object' &&
        oxcOptions.jsx.runtime === undefined))
  ) {
    oxcOptions.jsx = 'preserve'
  }
  if (oxcOptions.jsx !== 'preserve' && oxcOptions.jsx !== false) {
    const jsxOptions: OxcJsxOptions =
      typeof oxcOptions.jsx === 'string'
        ? getRollupJsxPresets(oxcOptions.jsx)
        : { ...oxcOptions.jsx }
    const typescriptOptions = { ...oxcOptions.typescript }

    if (tsCompilerOptions.jsxFactory) {
      jsxOptions.pragma ??= tsCompilerOptions.jsxFactory
      typescriptOptions.jsxPragma = jsxOptions.pragma
    }
    if (tsCompilerOptions.jsxFragmentFactory) {
      jsxOptions.pragmaFrag ??= tsCompilerOptions.jsxFragmentFactory
      typescriptOptions.jsxPragmaFrag = jsxOptions.pragmaFrag
    }
    if (tsCompilerOptions.jsxImportSource) {
      jsxOptions.importSource ??= tsCompilerOptions.jsxImportSource
    }

    if (!jsxOptions.runtime) {
      switch (tsCompilerOptions.jsx) {
        case 'react':
          jsxOptions.runtime = 'classic'
          // this option should not be set when using classic runtime
          jsxOptions.importSource = undefined
          break
        case 'react-jsxdev':
          jsxOptions.development = true
        // eslint-disable-next-line no-fallthrough
        case 'react-jsx':
          jsxOptions.runtime = 'automatic'
          // these options should not be set when using automatic runtime
          jsxOptions.pragma = undefined
          typescriptOptions.jsxPragma = undefined
          jsxOptions.pragmaFrag = undefined
          typescriptOptions.jsxPragmaFrag = undefined
          break
        default:
          break
      }
    }

    oxcOptions.jsx = jsxOptions
    oxcOptions.typescript = typescriptOptions
  }

  if (oxcOptions.decorator?.legacy === undefined) {
    const experimentalDecorators = tsCompilerOptions.experimentalDecorators
    if (experimentalDecorators !== undefined) {
      oxcOptions.decorator ??= {}
      oxcOptions.decorator.legacy = experimentalDecorators
    }
    const emitDecoratorMetadata = tsCompilerOptions.emitDecoratorMetadata
    if (emitDecoratorMetadata !== undefined) {
      oxcOptions.decorator ??= {}
      oxcOptions.decorator.emitDecoratorMetadata = emitDecoratorMetadata
    }
  }

  /**
   * | preserveValueImports | importsNotUsedAsValues | verbatimModuleSyntax | onlyRemoveTypeImports |
   * | -------------------- | ---------------------- | -------------------- |---------------------- |
   * | false                | remove                 | false                | false                 |
   * | false                | preserve, error        | -                    | -                     |
   * | true                 | remove                 | -                    | -                     |
   * | true                 | preserve, error        | true                 | true                  |
   */
  if (oxcOptions.typescript?.onlyRemoveTypeImports === undefined) {
    if (tsCompilerOptions.verbatimModuleSyntax !== undefined) {
      oxcOptions.typescript ??= {}
      oxcOptions.typescript.onlyRemoveTypeImports =
        tsCompilerOptions.verbatimModuleSyntax
    } else if (
      tsCompilerOptions.preserveValueImports !== undefined ||
      tsCompilerOptions.importsNotUsedAsValues !== undefined
    ) {
      const preserveValueImports =
        tsCompilerOptions.preserveValueImports ?? false
      const importsNotUsedAsValues =
        tsCompilerOptions.importsNotUsedAsValues ?? 'remove'
      if (
        preserveValueImports === false &&
        importsNotUsedAsValues === 'remove'
      ) {
        oxcOptions.typescript ??= {}
        oxcOptions.typescript.onlyRemoveTypeImports = true
      } else if (
        preserveValueImports === true &&
        (importsNotUsedAsValues === 'preserve' ||
          importsNotUsedAsValues === 'error')
      ) {
        oxcOptions.typescript ??= {}
        oxcOptions.typescript.onlyRemoveTypeImports = false
      } else {
        warnings.push(
          `preserveValueImports=${preserveValueImports} + importsNotUsedAsValues=${importsNotUsedAsValues} is not supported by oxc.` +
            'Please migrate to the new verbatimModuleSyntax option.',
        )
        oxcOptions.typescript ??= {}
        oxcOptions.typescript.onlyRemoveTypeImports = false
      }
    }
  }

  const resolvedTsconfigTarget = resolveTsconfigTarget(tsCompilerOptions.target)
  const useDefineForClassFields =
    tsCompilerOptions.useDefineForClassFields ??
    (resolvedTsconfigTarget === 'next' || resolvedTsconfigTarget >= 2022)
  oxcOptions.assumptions ??= {}
  oxcOptions.assumptions.setPublicClassFields = !useDefineForClassFields
  oxcOptions.typescript ??= {}
  oxcOptions.typescript.removeClassFieldsWithoutInitializer =
    !useDefineForClassFields
}

export async function transformWithOxc(
  code: string,
  filename: string,
  options?: OxcTransformOptions,
  inMap?: object,
  config?: ResolvedConfig,
  watcher?: FSWatcher,
): Promise<Omit<OxcTransformResult, 'errors'> & { warnings: string[] }> {
  const warnings: string[] = []
  let lang = options?.lang

  if (!lang) {
    // if the id ends with a valid ext, use it (e.g. vue blocks)
    // otherwise, cleanup the query before checking the ext
    const ext = path
      .extname(validExtensionRE.test(filename) ? filename : cleanUrl(filename))
      .slice(1)

    if (ext === 'cjs' || ext === 'mjs') {
      lang = 'js'
    } else if (ext === 'cts' || ext === 'mts') {
      lang = 'ts'
    } else {
      lang = ext as 'js' | 'jsx' | 'ts' | 'tsx'
    }
  }

  const resolvedOptions = {
    sourcemap: true,
    ...options,
    lang,
  }

  if (lang === 'ts' || lang === 'tsx') {
    try {
      const { tsconfig: loadedTsconfig, tsconfigFile } =
        await loadTsconfigJsonForFile(filename, config)
      // tsconfig could be out of root, make sure it is watched on dev
      if (watcher && tsconfigFile && config) {
        ensureWatchedFile(watcher, tsconfigFile, config.root)
      }
      setOxcTransformOptionsFromTsconfigOptions(
        resolvedOptions,
        loadedTsconfig.compilerOptions,
        warnings,
      )
    } catch (e) {
      if (e instanceof TSConfckParseError) {
        // tsconfig could be out of root, make sure it is watched on dev
        if (watcher && e.tsconfigFile && config) {
          ensureWatchedFile(watcher, e.tsconfigFile, config.root)
        }
      }
      throw e
    }
  }

  const result = transformSync(filename, code, resolvedOptions)

  if (result.errors.length > 0) {
    const firstError = result.errors[0]
    const error: RollupError = new Error(firstError.message)
    let frame = ''
    frame += firstError.labels
      .map(
        (l) =>
          (l.message ? `${l.message}\n` : '') +
          generateCodeFrame(code, l.start, l.end),
      )
      .join('\n')
    if (firstError.helpMessage) {
      frame += '\n' + firstError.helpMessage
    }
    error.frame = frame
    error.pos =
      firstError.labels.length > 0 ? firstError.labels[0].start : undefined
    throw error
  }

  let map: SourceMap
  if (inMap && result.map) {
    const nextMap = result.map
    nextMap.sourcesContent = []
    map = combineSourcemaps(filename, [
      nextMap as RawSourceMap,
      inMap as RawSourceMap,
    ]) as SourceMap
  } else {
    map = result.map as SourceMap
  }
  return {
    ...result,
    map,
    warnings,
  }
}

function resolveTsconfigTarget(target: string | undefined): number | 'next' {
  if (!target) return 5

  const targetLowered = target.toLowerCase()
  if (!targetLowered.startsWith('es')) return 5

  if (targetLowered === 'esnext') return 'next'
  return parseInt(targetLowered.slice(2))
}

export function oxcPlugin(config: ResolvedConfig): Plugin {
  if (config.isBundled && config.nativePluginEnabledLevel >= 1) {
    return perEnvironmentPlugin('native:transform', (environment) => {
      const {
        jsxInject,
        include = /\.(m?ts|[jt]sx)$/,
        exclude = /\.js$/,
        jsxRefreshInclude,
        jsxRefreshExclude,
        ..._transformOptions
      } = config.oxc as Exclude<OxcOptions, false | undefined>

      const transformOptions: OxcTransformOptions = _transformOptions
      transformOptions.sourcemap =
        environment.config.mode !== 'build' ||
        !!environment.config.build.sourcemap

      return nativeTransformPlugin({
        root: environment.config.root,
        include,
        exclude,
        jsxRefreshInclude,
        jsxRefreshExclude,
        isServerConsumer: environment.config.consumer === 'server',
        jsxInject,
        transformOptions,
      })
    })
  }

  const options = config.oxc as OxcOptions
  const {
    jsxInject,
    include,
    exclude,
    jsxRefreshInclude,
    jsxRefreshExclude,
    ...oxcTransformOptions
  } = options

  const filter = createFilter(include || /\.(m?ts|[jt]sx)$/, exclude || /\.js$/)
  const jsxRefreshFilter =
    jsxRefreshInclude || jsxRefreshExclude
      ? createFilter(jsxRefreshInclude, jsxRefreshExclude)
      : undefined

  const jsxImportSource =
    (typeof oxcTransformOptions.jsx === 'object' &&
      oxcTransformOptions.jsx.importSource) ||
    'react'
  const jsxImportRuntime = `${jsxImportSource}/jsx-runtime`
  const jsxImportDevRuntime = `${jsxImportSource}/jsx-dev-runtime`

  const getModifiedOxcTransformOptions = (
    oxcTransformOptions: OxcTransformOptions,
    id: string,
    code: string,
    environment: Environment,
  ): OxcTransformOptions => {
    const result: OxcTransformOptions = {
      ...oxcTransformOptions,
      sourcemap:
        environment.mode !== 'build' || !!environment.config.build.sourcemap,
    }

    const jsxOptions = result.jsx

    // disable refresh based by the same condition as @vitejs/plugin-react
    // https://github.com/vitejs/vite-plugin-react/blob/c8ecad052001b6fc42e508f18433e6b305bca641/packages/plugin-react/src/index.ts#L261-L269
    const [filepath] = id.split('?')
    const isJSX = filepath.endsWith('x')

    if (
      typeof jsxOptions === 'object' &&
      jsxOptions.refresh &&
      (environment.config.consumer === 'server' ||
        (jsxRefreshFilter && !jsxRefreshFilter(id)) ||
        !(
          isJSX ||
          code.includes(jsxImportRuntime) ||
          code.includes(jsxImportDevRuntime)
        ))
    ) {
      result.jsx = { ...jsxOptions, refresh: false }
    }
    if (jsxRefreshFilter?.(id) && !JS_TYPES_RE.test(cleanUrl(id))) {
      result.lang = 'js'
    }

    return result
  }
  const runtimeResolveBase = normalizePath(
    path.join(VITE_PACKAGE_DIR, 'package.json'),
  )

  let server: ViteDevServer

  return {
    name: 'vite:oxc',
    configureServer(_server) {
      server = _server
    },
    // @oxc-project/runtime resolution is handled by rolldown in build
    ...(config.command === 'serve'
      ? {
          resolveId: {
            filter: {
              id: prefixRegex('@oxc-project/runtime/'),
            },
            async handler(id, _importer, opts) {
              // @oxc-project/runtime imports will be injected by Oxc transform
              // since it's injected by the transform, @oxc-project/runtime should be resolved to the one Vite depends on
              const resolved = await this.resolve(id, runtimeResolveBase, opts)
              return resolved
            },
            order: 'pre',
          },
        }
      : {}),
    async transform(code, id) {
      if (filter(id) || filter(cleanUrl(id)) || jsxRefreshFilter?.(id)) {
        const modifiedOxcTransformOptions = getModifiedOxcTransformOptions(
          oxcTransformOptions,
          id,
          code,
          this.environment,
        )
        const result = await transformWithOxc(
          code,
          id,
          modifiedOxcTransformOptions,
          undefined,
          config,
          server?.watcher,
        )
        if (jsxInject && jsxExtensionsRE.test(id)) {
          result.code = jsxInject + ';' + result.code
        }
        for (const warning of result.warnings) {
          this.environment.logger.warnOnce(warning)
        }
        return {
          code: result.code,
          map: result.map,
          moduleType: 'js',
        }
      }
    },
  }
}

export const buildOxcPlugin = (): Plugin => {
  return {
    name: 'vite:oxc-transpile',
    applyToEnvironment(environment) {
      return environment.config.oxc !== false
    },
    async renderChunk(code, chunk, opts) {
      // avoid on legacy chunks since it produces legacy-unsafe code
      // e.g. rewriting object properties into shorthands
      if (this.environment.config.isOutputOptionsForLegacyChunks?.(opts)) {
        return null
      }

      const config = this.environment.config
      const options = resolveOxcTranspileOptions(config, opts.format)

      if (!options) {
        return null
      }

      const res = await transformWithOxc(
        code,
        chunk.fileName,
        options,
        undefined,
        config,
      )
      for (const warning of res.warnings) {
        this.environment.logger.warnOnce(warning)
      }

      const runtimeHelpers = Object.entries(res.helpersUsed)
      if (runtimeHelpers.length > 0) {
        // The length is kept to avoid sourcemap generation
        let newCode = res.code.replace(
          /babelHelpers\.([A-Za-z_$][\w$]*)\b/g,
          'babelHelpers_$1',
        )

        const helpersCode = await generateRuntimeHelpers(runtimeHelpers)
        switch (opts.format) {
          case 'es': {
            if (newCode.startsWith('#!')) {
              let secondLinePos = newCode.indexOf('\n')
              if (secondLinePos === -1) {
                secondLinePos = 0
              }
              // inject after hashbang
              newCode =
                newCode.slice(0, secondLinePos) +
                helpersCode +
                newCode.slice(secondLinePos)
              if (res.map) {
                res.map.mappings = res.map.mappings.replace(';', ';;')
              }
            } else {
              newCode = helpersCode + newCode
              if (res.map) {
                res.map.mappings = ';' + res.map.mappings
              }
            }
            break
          }
          case 'cjs': {
            if (/^\s*['"]use strict['"];/.test(newCode)) {
              // inject after use strict
              newCode = newCode.replace(
                /^\s*['"]use strict['"];/,
                (m) => m + helpersCode,
              )
              // no need to update sourcemap because the runtime helpers are injected in the same line with "use strict"
            } else {
              newCode = helpersCode + newCode
              if (res.map) {
                res.map.mappings = ';' + res.map.mappings
              }
            }
            break
          }
          // runtime helpers needs to be injected inside the UMD and IIFE wrappers
          // to avoid collision with other globals.
          // We inject the helpers inside the wrappers.
          // e.g. turn:
          //    (function(){ /*actual content/* })()
          // into:
          //    (function(){ <runtime helpers> /*actual content/* })()
          // Not using regex because it's too hard to rule out performance issues like #8738 #8099 #10900 #14065
          // Instead, using plain string index manipulation (indexOf, slice) which is simple and performant
          // We don't need to create a MagicString here because both the helpers and
          // the headers don't modify the sourcemap
          case 'iife':
          case 'umd': {
            const m = (
              opts.format === 'iife' ? IIFE_BEGIN_RE : UMD_BEGIN_RE
            ).exec(newCode)
            if (!m) {
              this.error(`Unexpected ${opts.format.toUpperCase()} format`)
              return
            }
            const pos = m.index + m[0].length
            newCode =
              newCode.slice(0, pos) + helpersCode + '\n' + newCode.slice(pos)
            break
          }
          default: {
            opts.format satisfies never
          }
        }
        res.code = newCode
      }

      return res
    },
  }
}

export function resolveOxcTranspileOptions(
  config: ResolvedConfig,
  format: InternalModuleFormat,
): OxcTransformOptions | null {
  const target = config.build.target
  if (!target || target === 'esnext') {
    return null
  }

  return {
    ...config.oxc,
    helpers: { mode: 'External' },
    lang: 'js',
    sourceType: format === 'es' ? 'module' : 'script',
    target: target || undefined,
    sourcemap: !!config.build.sourcemap,
  }
}

async function generateRuntimeHelpers(
  runtimeHelpers: readonly [string, string][],
): Promise<string> {
  const isAsciiOnlyIdentifierRE = /^[A-Za-z_$][\w$]*$/
  const cjsExportRE = /\bexports\.([A-Za-z_$][\w$]*)\s*=/g

  const bundle = await rolldown({
    cwd: url.fileURLToPath(/** #__KEEP__ */ import.meta.url),
    input: 'entrypoint',
    platform: 'neutral',
    logLevel: 'silent',
    plugins: [
      {
        name: 'entrypoint',
        resolveId: {
          filter: { id: exactRegex('entrypoint') },
          handler: (id) => id,
        },
        load: {
          filter: { id: exactRegex('entrypoint') },
          handler() {
            return runtimeHelpers
              .map(
                ([name, helper]) =>
                  `export { default as ${name} } from ${JSON.stringify(helper)};`,
              )
              .join('\n')
          },
        },
      },
      {
        name: 'ensure-helper-names',
        renderChunk(_code, chunk) {
          if (chunk.exports.some((e) => !isAsciiOnlyIdentifierRE.test(e))) {
            throw new Error(
              `Expected all runtime helper export names to be ASCII-only. Got ${chunk.exports.filter((e) => !isAsciiOnlyIdentifierRE.test(e)).join(', ')}`,
            )
          }
        },
      },
    ],
  })
  const output = await bundle.generate({
    format: 'cjs',
    minify: true,
    generatedCode: { symbols: false },
  })
  const outputCode = output.output[0].code
  const exportNames = [...outputCode.matchAll(cjsExportRE)].map((m) => m[1])
  return (
    `var ${exportNames.map((n) => `babelHelpers_${n}`).join(', ')};` +
    `!(() => {${outputCode.replace(cjsExportRE, 'babelHelpers_$1=')}})();`
  )
}

type OxcJsxOptions = Exclude<OxcOptions['jsx'], string | undefined>

export function convertEsbuildConfigToOxcConfig(
  esbuildConfig: ESBuildOptions,
  logger: Logger,
): OxcOptions {
  const { jsxInject, include, exclude, ...esbuildTransformOptions } =
    esbuildConfig

  const oxcOptions: OxcOptions = {
    jsxInject,
    include,
    exclude,
  }

  if (esbuildTransformOptions.jsx === 'preserve') {
    oxcOptions.jsx = 'preserve'
  } else {
    const jsxOptions: OxcJsxOptions = {}

    switch (esbuildTransformOptions.jsx) {
      case 'automatic':
        jsxOptions.runtime = 'automatic'
        if (esbuildTransformOptions.jsxImportSource) {
          jsxOptions.importSource = esbuildTransformOptions.jsxImportSource
        }
        break
      case 'transform':
        jsxOptions.runtime = 'classic'
        if (esbuildTransformOptions.jsxFactory) {
          jsxOptions.pragma = esbuildTransformOptions.jsxFactory
        }
        if (esbuildTransformOptions.jsxFragment) {
          jsxOptions.pragmaFrag = esbuildTransformOptions.jsxFragment
        }
        break
      default:
        break
    }

    if (esbuildTransformOptions.jsxDev !== undefined) {
      jsxOptions.development = esbuildTransformOptions.jsxDev
    }
    if (esbuildTransformOptions.jsxSideEffects !== undefined) {
      jsxOptions.pure = esbuildTransformOptions.jsxSideEffects
    }

    oxcOptions.jsx = jsxOptions
  }

  if (esbuildTransformOptions.define) {
    oxcOptions.define = esbuildTransformOptions.define
  }

  // these backward compat are supported by esbuildBannerFooterCompatPlugin
  if (esbuildTransformOptions.banner) {
    warnDeprecatedShouldBeConvertedToPluginOptions(logger, 'banner')
  }
  if (esbuildTransformOptions.footer) {
    warnDeprecatedShouldBeConvertedToPluginOptions(logger, 'footer')
  }

  return oxcOptions
}

function warnDeprecatedShouldBeConvertedToPluginOptions(
  logger: Logger,
  name: string,
) {
  logger.warn(
    colors.yellow(
      `\`esbuild.${name}\` option was specified. ` +
        `But this option is deprecated and will be removed in future versions. ` +
        'This option can be achieved by using a plugin with transform hook, please use that instead.',
    ),
  )
}
