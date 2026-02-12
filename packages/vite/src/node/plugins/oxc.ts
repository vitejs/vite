import path from 'node:path'
import type {
  TransformOptions as OxcTransformOptions,
  TransformResult as OxcTransformResult,
} from 'rolldown/utils'
import { transformSync } from 'rolldown/utils'
import { viteTransformPlugin as nativeTransformPlugin } from 'rolldown/experimental'
import type { RolldownError, RolldownLog, SourceMap } from 'rolldown'
import colors from 'picocolors'
import { prefixRegex } from 'rolldown/filter'
import type { FSWatcher } from '#dep-types/chokidar'
import { createFilter, ensureWatchedFile, normalizePath } from '../utils'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import { cleanUrl } from '../../shared/utils'
import { type Environment, perEnvironmentPlugin } from '..'
import type { ViteDevServer } from '../server'
import { JS_TYPES_RE, VITE_PACKAGE_DIR } from '../constants'
import type { Logger } from '../logger'
import type { ESBuildOptions } from './esbuild'

// IIFE content looks like `var MyLib = (function() {` or `this.nested.myLib = (function() {`.
export const IIFE_BEGIN_RE: RegExp =
  /(?:(?:(?:const|var)\s+[^.\s]+|[^.\s]+\.[^.\s]+\.[^.\s]+)\s*=\s*|^|\n)\(?function\([^()]*\)\s*\{(?:\s*"use strict";)?/
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

// Copy from rolldown's packages/rolldown/src/utils/errors.ts
function joinNewLine(s1: string, s2: string): string {
  // ensure single new line in between
  return s1.replace(/\n+$/, '') + '\n' + s2.replace(/^\n+/, '')
}

// Copy from rolldown's packages/rolldown/src/utils/errors.ts
function getErrorMessage(e: RolldownError): string {
  // If the `kind` field is present, we assume it represents
  // a custom error defined by rolldown on the Rust side.
  if (Object.hasOwn(e, 'kind')) {
    return e.message
  }

  let s = ''
  if (e.plugin) {
    s += `[plugin ${e.plugin}]`
  }
  const id = e.id ?? e.loc?.file
  if (id) {
    s += ' ' + id
    if (e.loc) {
      s += `:${e.loc.line}:${e.loc.column}`
    }
  }
  if (s) {
    s += '\n'
  }
  const message = `${e.name ?? 'Error'}: ${e.message}`
  s += message
  if (e.frame) {
    s = joinNewLine(s, e.frame)
  }
  // copy stack since it's important for js plugin error
  if (e.stack) {
    s = joinNewLine(s, e.stack.replace(message, ''))
  }
  if (e.cause) {
    s = joinNewLine(s, 'Caused by:')
    s = joinNewLine(
      s,
      getErrorMessage(e.cause as any)
        .split('\n')
        .map((line) => '  ' + line)
        .join('\n'),
    )
  }
  return s
}

export async function transformWithOxc(
  code: string,
  filename: string,
  options?: OxcTransformOptions,
  inMap?: object,
  config?: ResolvedConfig,
  watcher?: FSWatcher,
): Promise<Omit<OxcTransformResult, 'errors'>> {
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
    inputMap: inMap as SourceMap | undefined,
    lang,
  }

  const result = transformSync(filename, code, resolvedOptions)
  if (
    watcher &&
    config &&
    result.tsconfigFilePaths &&
    result.tsconfigFilePaths.length > 0
  ) {
    for (const tsconfigFile of result.tsconfigFilePaths) {
      ensureWatchedFile(watcher, normalizePath(tsconfigFile), config.root)
    }
  }

  if (result.errors.length > 0) {
    // Copy from rolldown's packages/rolldown/src/utils/errors.ts
    let summary = `Transform failed with ${result.errors.length} error${result.errors.length < 2 ? '' : 's'}:\n`
    for (let i = 0; i < result.errors.length; i++) {
      summary += '\n'
      if (i >= 5) {
        summary += '...'
        break
      }
      summary += getErrorMessage(result.errors[i])
    }

    const wrapper = new Error(summary)
    // expose individual errors as getters so that
    // `console.error(wrapper)` doesn't expand unnecessary details
    // when they are already presented in `wrapper.message`
    Object.defineProperty(wrapper, 'errors', {
      configurable: true,
      enumerable: true,
      get: () => result.errors,
      set: (value) =>
        Object.defineProperty(wrapper, 'errors', {
          configurable: true,
          enumerable: true,
          value,
        }),
    })
    throw wrapper
  }
  return result
}

const warnedMessages = new Set<string>()
function shouldSkipWarning(warning: RolldownLog): boolean {
  if (warning.code === 'UNSUPPORTED_TSCONFIG_OPTION') {
    if (warnedMessages.has(warning.message)) return true
    warnedMessages.add(warning.message)
  }
  return false
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
          if (!shouldSkipWarning(warning)) {
            this.warn(warning)
          }
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
