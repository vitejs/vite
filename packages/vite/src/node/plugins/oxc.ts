import path from 'node:path'
import url from 'node:url'
import type {
  TransformOptions as OxcTransformOptions,
  TransformResult as OxcTransformResult,
} from 'rolldown/experimental'
import { transform } from 'rolldown/experimental'
import type { RawSourceMap } from '@ampproject/remapping'
import type { InternalModuleFormat, RollupError, SourceMap } from 'rolldown'
import { rolldown } from 'rolldown'
import type { FSWatcher } from 'dep-types/chokidar'
import { TSConfckParseError } from 'tsconfck'
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
import type { Environment, Logger } from '..'
import type { ViteDevServer } from '../server'
import type { ESBuildOptions } from './esbuild'
import { loadTsconfigJsonForFile } from './esbuild'

// IIFE content looks like `var MyLib = (function() {`.
const IIFE_BEGIN_RE =
  /(?:(?:const|var)\s+\S+\s*=\s*|^|\n)\(?function\([^()]*\)\s*\{(?:\s*"use strict";)?/
// UMD content looks like `(this, function(exports) {`.
const UMD_BEGIN_RE = /\(this,\s*function\([^()]*\)\s*\{(?:\s*"use strict";)?/

const jsxExtensionsRE = /\.(?:j|t)sx\b/
const validExtensionRE = /\.\w+$/

export interface OxcOptions
  extends Exclude<
    OxcTransformOptions,
    'cwd' | 'sourceType' | 'lang' | 'sourcemap' | 'helpers'
  > {
  include?: string | RegExp | ReadonlyArray<string | RegExp>
  exclude?: string | RegExp | ReadonlyArray<string | RegExp>
  jsxInject?: string
  jsxInclude?: string | RegExp | ReadonlyArray<string | RegExp>
  jsxExclude?: string | RegExp | ReadonlyArray<string | RegExp>
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
      const loadedCompilerOptions = loadedTsconfig.compilerOptions ?? {}

      // when both the normal options and tsconfig is set,
      // we want to prioritize the normal options
      if (
        resolvedOptions.jsx === undefined ||
        (typeof resolvedOptions.jsx === 'object' &&
          resolvedOptions.jsx.runtime === undefined)
      ) {
        if (loadedCompilerOptions.jsx === 'preserve') {
          resolvedOptions.jsx = 'preserve'
        } else {
          const jsxOptions: OxcJsxOptions = { ...resolvedOptions.jsx }

          if (loadedCompilerOptions.jsxFactory) {
            jsxOptions.pragma ??= loadedCompilerOptions.jsxFactory
          }
          if (loadedCompilerOptions.jsxFragmentFactory) {
            jsxOptions.pragmaFrag ??= loadedCompilerOptions.jsxFragmentFactory
          }
          if (loadedCompilerOptions.jsxImportSource) {
            jsxOptions.importSource ??= loadedCompilerOptions.jsxImportSource
          }

          switch (loadedCompilerOptions.jsx) {
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
              jsxOptions.pragmaFrag = undefined
              break
            default:
              break
          }

          resolvedOptions.jsx = jsxOptions
        }
      }
      if (resolvedOptions.decorator?.legacy === undefined) {
        const experimentalDecorators =
          loadedCompilerOptions.experimentalDecorators
        if (experimentalDecorators !== undefined) {
          resolvedOptions.decorator ??= {}
          resolvedOptions.decorator.legacy = experimentalDecorators
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
      if (loadedCompilerOptions.verbatimModuleSyntax !== undefined) {
        resolvedOptions.typescript ??= {}
        resolvedOptions.typescript.onlyRemoveTypeImports =
          loadedCompilerOptions.verbatimModuleSyntax
      } else if (
        loadedCompilerOptions.preserveValueImports !== undefined ||
        loadedCompilerOptions.importsNotUsedAsValues !== undefined
      ) {
        const preserveValueImports =
          loadedCompilerOptions.preserveValueImports ?? false
        const importsNotUsedAsValues =
          loadedCompilerOptions.importsNotUsedAsValues ?? 'remove'
        if (
          preserveValueImports === false &&
          importsNotUsedAsValues === 'remove'
        ) {
          resolvedOptions.typescript ??= {}
          resolvedOptions.typescript.onlyRemoveTypeImports = true
        } else if (
          preserveValueImports === true &&
          (importsNotUsedAsValues === 'preserve' ||
            importsNotUsedAsValues === 'error')
        ) {
          resolvedOptions.typescript ??= {}
          resolvedOptions.typescript.onlyRemoveTypeImports = false
        } else {
          warnings.push(
            `preserveValueImports=${preserveValueImports} + importsNotUsedAsValues=${importsNotUsedAsValues} is not supported by oxc.` +
              'Please migrate to the new verbatimModuleSyntax option.',
          )
          resolvedOptions.typescript ??= {}
          resolvedOptions.typescript.onlyRemoveTypeImports = false
        }
      } else {
        resolvedOptions.typescript ??= {}
        resolvedOptions.typescript.onlyRemoveTypeImports = false
      }

      const resolvedTsconfigTarget = resolveTsconfigTarget(
        loadedCompilerOptions.target,
      )
      const useDefineForClassFields =
        loadedCompilerOptions.useDefineForClassFields ??
        (resolvedTsconfigTarget === 'next' || resolvedTsconfigTarget >= 2022)
      resolvedOptions.assumptions ??= {}
      resolvedOptions.assumptions.setPublicClassFields =
        !useDefineForClassFields

      // set target to es2021 or lower to enable class property transforms
      // https://github.com/oxc-project/oxc/issues/6735#issuecomment-2513866362
      if (!useDefineForClassFields) {
        let set = false
        if (!resolvedOptions.target) {
          resolvedOptions.target = 'es2021'
          set = true
        } else {
          const target = Array.isArray(resolvedOptions.target)
            ? [...resolvedOptions.target]
            : resolvedOptions.target.split(',')
          const esTargetIndex = target.findIndex((t) =>
            t.toLowerCase().startsWith('es'),
          )
          if (esTargetIndex >= 0) {
            const esTargetTrimmed = target[esTargetIndex].toLowerCase().slice(2)
            if (
              esTargetTrimmed === 'next' ||
              parseInt(esTargetTrimmed, 10) > 2021
            ) {
              target[esTargetIndex] = 'es2021'
              set = true
            }
          } else {
            target.push('es2021')
            set = true
          }
          resolvedOptions.target = target
        }

        if (set) {
          warnings.push(
            'target was modified to include ES2021' +
              ' because useDefineForClassFields is set to false' +
              ' and oxc does not support transforming useDefineForClassFields=false for ES2022+ yet',
          )
        }
      }
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

  const result = transform(filename, code, resolvedOptions)

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
  const options = config.oxc as OxcOptions
  const {
    jsxInject,
    include,
    exclude,
    jsxInclude,
    jsxExclude,
    ...oxcTransformOptions
  } = options

  const defaultInclude = Array.isArray(include)
    ? include
    : [include || /\.(m?ts|[jt]sx)$/]
  const filter = createFilter(
    defaultInclude.concat(jsxInclude || []),
    exclude || /\.js$/,
  )
  const jsxFilter = createFilter(
    jsxInclude || /\.jsx$/,
    jsxExclude || /\.(m?[jt]s|tsx)$/,
  )

  const getModifiedOxcTransformOptions = (
    oxcTransformOptions: OxcTransformOptions,
    id: string,
    environment: Environment,
  ): OxcTransformOptions => {
    const result: OxcTransformOptions = {
      ...oxcTransformOptions,
      sourcemap:
        environment.mode !== 'build' || !!environment.config.build.sourcemap,
    }

    const jsxOptions = result.jsx
    // disable refresh at ssr
    if (
      environment.config.consumer === 'server' &&
      typeof jsxOptions === 'object' &&
      jsxOptions.refresh
    ) {
      result.jsx = { ...jsxOptions, refresh: false }
    }

    if ((jsxFilter(id) || jsxFilter(cleanUrl(id))) && !result.lang) {
      result.lang = 'jsx'
    }

    return result
  }
  const _filename = normalizePath(url.fileURLToPath(import.meta.url))

  let server: ViteDevServer

  return {
    name: 'vite:oxc',
    configureServer(_server) {
      server = _server
    },
    resolveId: {
      filter: {
        id: /^@oxc-project\/runtime\//,
      },
      async handler(id, _importer, opts) {
        // @oxc-project/runtime imports will be injected by OXC transform
        // since it's injected by the transform, @oxc-project/runtime should be resolved to the one Vite depends on
        const resolved = await this.resolve(id, _filename, opts)
        return resolved
      },
    },
    async transform(code, id) {
      if (filter(id) || filter(cleanUrl(id))) {
        const modifiedOxcTransformOptions = getModifiedOxcTransformOptions(
          oxcTransformOptions,
          id,
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
      // @ts-expect-error injected by @vitejs/plugin-legacy
      if (opts.__vite_skip_esbuild__) {
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
        const helpersCode = await generateRuntimeHelpers(runtimeHelpers)
        switch (opts.format) {
          case 'es': {
            if (res.code.startsWith('#!')) {
              let secondLinePos = res.code.indexOf('\n')
              if (secondLinePos === -1) {
                secondLinePos = 0
              }
              // inject after hashbang
              res.code =
                res.code.slice(0, secondLinePos) +
                helpersCode +
                res.code.slice(secondLinePos)
              if (res.map) {
                res.map.mappings = res.map.mappings.replace(';', ';;')
              }
            } else {
              res.code = helpersCode + res.code
              if (res.map) {
                res.map.mappings = ';' + res.map.mappings
              }
            }
            break
          }
          case 'cjs': {
            if (/^\s*['"]use strict['"];/.test(res.code)) {
              // inject after use strict
              res.code = res.code.replace(
                /^\s*['"]use strict['"];/,
                (m) => m + helpersCode,
              )
              // no need to update sourcemap because the runtime helpers are injected in the same line with "use strict"
            } else {
              res.code = helpersCode + res.code
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
            ).exec(res.code)
            if (!m) {
              this.error('Unexpected IIFE format')
              return
            }
            const pos = m.index + m[0].length
            res.code =
              res.code.slice(0, pos) + helpersCode + '\n' + res.code.slice(pos)
            break
          }
          case 'app': {
            throw new Error('format: "app" is not supported yet')
            break
          }
          default: {
            opts.format satisfies never
          }
        }
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
  const bundle = await rolldown({
    cwd: url.fileURLToPath(import.meta.url),
    input: 'entrypoint',
    platform: 'neutral',
    logLevel: 'silent',
    plugins: [
      {
        name: 'entrypoint',
        resolveId: {
          filter: { id: /^entrypoint$/ },
          handler: (id) => id,
        },
        load: {
          filter: { id: /^entrypoint$/ },
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
    ],
  })
  const output = await bundle.generate({
    format: 'iife',
    name: 'babelHelpers',
    minify: true,
  })
  return output.output[0].code
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

    oxcOptions.jsx = jsxOptions
  }

  if (esbuildTransformOptions.loader) {
    if (['js', 'jsx', 'ts', 'tsx'].includes(esbuildTransformOptions.loader)) {
      oxcOptions.lang = esbuildTransformOptions.loader as
        | 'js'
        | 'jsx'
        | 'ts'
        | 'tsx'
    } else {
      logger.warn(
        `The esbuild loader ${esbuildTransformOptions.loader} is not supported by oxc`,
      )
    }
  }
  if (esbuildTransformOptions.define) {
    oxcOptions.define = esbuildTransformOptions.define
  }

  switch (esbuildTransformOptions.sourcemap) {
    case true:
    case false:
    case undefined:
      oxcOptions.sourcemap = esbuildTransformOptions.sourcemap
      break
    case 'external':
      oxcOptions.sourcemap = true
      break
    // ignore it because it's not supported by esbuild `transform`
    case 'linked':
      break
    default:
      logger.warn(
        `The esbuild sourcemap ${esbuildTransformOptions.sourcemap} is not supported by oxc`,
      )
      break
  }

  return oxcOptions
}
