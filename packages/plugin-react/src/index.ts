import path from 'node:path'
import type { ParserOptions, TransformOptions, types as t } from '@babel/core'
import * as babel from '@babel/core'
import { createFilter, normalizePath } from 'vite'
import type { Plugin, PluginOption, ResolvedConfig } from 'vite'
import MagicString from 'magic-string'
import type { SourceMap } from 'magic-string'
import {
  addRefreshWrapper,
  isRefreshBoundary,
  preambleCode,
  runtimeCode,
  runtimePublicPath
} from './fast-refresh'
import { babelImportToRequire } from './jsx-runtime/babel-import-to-require'
import { restoreJSX } from './jsx-runtime/restore-jsx'

export interface Options {
  include?: string | RegExp | Array<string | RegExp>
  exclude?: string | RegExp | Array<string | RegExp>
  /**
   * Enable `react-refresh` integration. Vite disables this in prod env or build mode.
   * @default true
   */
  fastRefresh?: boolean
  /**
   * Set this to `"automatic"` to use [vite-react-jsx](https://github.com/alloc/vite-react-jsx).
   * @default "automatic"
   */
  jsxRuntime?: 'classic' | 'automatic'
  /**
   * Control where the JSX factory is imported from.
   * This option is ignored when `jsxRuntime` is not `"automatic"`.
   * @default "react"
   */
  jsxImportSource?: string
  /**
   * Set this to `true` to annotate the JSX factory with `\/* @__PURE__ *\/`.
   * This option is ignored when `jsxRuntime` is not `"automatic"`.
   * @default true
   */
  jsxPure?: boolean
  /**
   * Babel configuration applied in both dev and prod.
   */
  babel?:
    | BabelOptions
    | ((id: string, options: { ssr?: boolean }) => BabelOptions)
}

export type BabelOptions = Omit<
  TransformOptions,
  | 'ast'
  | 'filename'
  | 'root'
  | 'sourceFileName'
  | 'sourceMaps'
  | 'inputSourceMap'
>

/**
 * The object type used by the `options` passed to plugins with
 * an `api.reactBabel` method.
 */
export interface ReactBabelOptions extends BabelOptions {
  plugins: Extract<BabelOptions['plugins'], any[]>
  presets: Extract<BabelOptions['presets'], any[]>
  overrides: Extract<BabelOptions['overrides'], any[]>
  parserOpts: ParserOptions & {
    plugins: Extract<ParserOptions['plugins'], any[]>
  }
}

type ReactBabelHook = (
  babelConfig: ReactBabelOptions,
  context: ReactBabelHookContext,
  config: ResolvedConfig
) => void

type ReactBabelHookContext = { ssr: boolean; id: string }

declare module 'vite' {
  export interface Plugin {
    api?: {
      /**
       * Manipulate the Babel options of `@vitejs/plugin-react`
       */
      reactBabel?: ReactBabelHook
    }
  }
}

const prependReactImportCode = "import React from 'react'; "

export default function viteReact(opts: Options = {}): PluginOption[] {
  // Provide default values for Rollup compat.
  let devBase = '/'
  let resolvedCacheDir: string
  let filter = createFilter(opts.include, opts.exclude)
  let needHiresSourcemap = false
  let isProduction = true
  let projectRoot = process.cwd()
  let skipFastRefresh = opts.fastRefresh === false
  let skipReactImport = false
  let runPluginOverrides = (
    options: ReactBabelOptions,
    context: ReactBabelHookContext
  ) => false
  let staticBabelOptions: ReactBabelOptions | undefined

  const useAutomaticRuntime = opts.jsxRuntime !== 'classic'

  // Support patterns like:
  // - import * as React from 'react';
  // - import React from 'react';
  // - import React, {useEffect} from 'react';
  const importReactRE = /(^|\n)import\s+(\*\s+as\s+)?React(,|\s+)/

  // Any extension, including compound ones like '.bs.js'
  const fileExtensionRE = /\.[^\/\s\?]+$/

  const viteBabel: Plugin = {
    name: 'vite:react-babel',
    enforce: 'pre',
    config() {
      if (opts.jsxRuntime === 'classic') {
        return {
          esbuild: {
            logOverride: {
              'this-is-undefined-in-esm': 'silent'
            }
          }
        }
      }
    },
    configResolved(config) {
      devBase = config.base
      projectRoot = config.root
      resolvedCacheDir = normalizePath(path.resolve(config.cacheDir))
      filter = createFilter(opts.include, opts.exclude, {
        resolve: projectRoot
      })
      needHiresSourcemap =
        config.command === 'build' && !!config.build.sourcemap
      isProduction = config.isProduction
      skipFastRefresh ||= isProduction || config.command === 'build'

      const jsxInject = config.esbuild && config.esbuild.jsxInject
      if (jsxInject && importReactRE.test(jsxInject)) {
        skipReactImport = true
        config.logger.warn(
          '[@vitejs/plugin-react] This plugin imports React for you automatically,' +
            ' so you can stop using `esbuild.jsxInject` for that purpose.'
        )
      }

      config.plugins.forEach((plugin) => {
        const hasConflict =
          plugin.name === 'react-refresh' ||
          (plugin !== viteReactJsx && plugin.name === 'vite:react-jsx')

        if (hasConflict)
          return config.logger.warn(
            `[@vitejs/plugin-react] You should stop using "${plugin.name}" ` +
              `since this plugin conflicts with it.`
          )
      })

      runPluginOverrides = (babelOptions, context) => {
        const hooks = config.plugins
          .map((plugin) => plugin.api?.reactBabel)
          .filter(Boolean) as ReactBabelHook[]

        if (hooks.length > 0) {
          return (runPluginOverrides = (babelOptions, context) => {
            hooks.forEach((hook) => hook(babelOptions, context, config))
            return true
          })(babelOptions, context)
        }
        runPluginOverrides = () => false
        return false
      }
    },
    async transform(code, id, options) {
      const ssr = options?.ssr === true
      // File extension could be mocked/overridden in querystring.
      const [filepath, querystring = ''] = id.split('?')
      const [extension = ''] =
        querystring.match(fileExtensionRE) ||
        filepath.match(fileExtensionRE) ||
        []

      if (/\.(mjs|[tj]sx?)$/.test(extension)) {
        const isJSX = extension.endsWith('x')
        const isNodeModules = id.includes('/node_modules/')
        const isProjectFile =
          !isNodeModules && (id[0] === '\0' || id.startsWith(projectRoot + '/'))

        let babelOptions = staticBabelOptions
        if (typeof opts.babel === 'function') {
          const rawOptions = opts.babel(id, { ssr })
          babelOptions = createBabelOptions(rawOptions)
          runPluginOverrides(babelOptions, { ssr, id: id })
        } else if (!babelOptions) {
          babelOptions = createBabelOptions(opts.babel)
          if (!runPluginOverrides(babelOptions, { ssr, id: id })) {
            staticBabelOptions = babelOptions
          }
        }

        const plugins = isProjectFile ? [...babelOptions.plugins] : []

        let useFastRefresh = false
        if (!skipFastRefresh && !ssr && !isNodeModules) {
          // Modules with .js or .ts extension must import React.
          const isReactModule = isJSX || importReactRE.test(code)
          if (isReactModule && filter(id)) {
            useFastRefresh = true
            plugins.push([
              await loadPlugin('react-refresh/babel'),
              { skipEnvCheck: true }
            ])
          }
        }

        let ast: t.File | null | undefined
        let prependReactImport = false
        if (!isProjectFile || isJSX) {
          if (useAutomaticRuntime) {
            // By reverse-compiling "React.createElement" calls into JSX,
            // React elements provided by dependencies will also use the
            // automatic runtime!
            // Avoid parsing the optimized react-dom since it will never
            // contain compiled JSX and it's a pretty big file (800kb).
            const isOptimizedReactDom =
              id.startsWith(resolvedCacheDir) && id.includes('/react-dom.js')
            const [restoredAst, isCommonJS] =
              !isProjectFile && !isJSX && !isOptimizedReactDom
                ? await restoreJSX(babel, code, id)
                : [null, false]

            if (isJSX || (ast = restoredAst)) {
              plugins.push([
                await loadPlugin(
                  '@babel/plugin-transform-react-jsx' +
                    (isProduction ? '' : '-development')
                ),
                {
                  runtime: 'automatic',
                  importSource: opts.jsxImportSource,
                  pure: opts.jsxPure !== false
                }
              ])

              // Avoid inserting `import` statements into CJS modules.
              if (isCommonJS) {
                plugins.push(babelImportToRequire)
              }
            }
          } else if (isProjectFile) {
            // These plugins are only needed for the classic runtime.
            if (!isProduction) {
              plugins.push(
                await loadPlugin('@babel/plugin-transform-react-jsx-self'),
                await loadPlugin('@babel/plugin-transform-react-jsx-source')
              )
            }

            // Even if the automatic JSX runtime is not used, we can still
            // inject the React import for .jsx and .tsx modules.
            if (!skipReactImport && !importReactRE.test(code)) {
              prependReactImport = true
            }
          }
        }

        let inputMap: SourceMap | undefined
        if (prependReactImport) {
          if (needHiresSourcemap) {
            const s = new MagicString(code)
            s.prepend(prependReactImportCode)
            code = s.toString()
            inputMap = s.generateMap({ hires: true, source: id })
          } else {
            code = prependReactImportCode + code
          }
        }

        // Plugins defined through this Vite plugin are only applied
        // to modules within the project root, but "babel.config.js"
        // files can define plugins that need to be applied to every
        // module, including node_modules and linked packages.
        const shouldSkip =
          !plugins.length &&
          !babelOptions.configFile &&
          !(isProjectFile && babelOptions.babelrc)

        // Avoid parsing if no plugins exist.
        if (shouldSkip) {
          return {
            code,
            map: inputMap ?? null
          }
        }

        const parserPlugins: typeof babelOptions.parserOpts.plugins = [
          ...babelOptions.parserOpts.plugins,
          'importMeta',
          // This plugin is applied before esbuild transforms the code,
          // so we need to enable some stage 3 syntax that is supported in
          // TypeScript and some environments already.
          'topLevelAwait',
          'classProperties',
          'classPrivateProperties',
          'classPrivateMethods'
        ]

        if (!extension.endsWith('.ts')) {
          parserPlugins.push('jsx')
        }

        if (/\.tsx?$/.test(extension)) {
          parserPlugins.push('typescript')
        }

        const transformAsync = ast
          ? babel.transformFromAstAsync.bind(babel, ast, code)
          : babel.transformAsync.bind(babel, code)

        const isReasonReact = extension.endsWith('.bs.js')
        const result = await transformAsync({
          ...babelOptions,
          ast: !isReasonReact,
          root: projectRoot,
          filename: id,
          sourceFileName: filepath,
          parserOpts: {
            ...babelOptions.parserOpts,
            sourceType: 'module',
            allowAwaitOutsideFunction: true,
            plugins: parserPlugins
          },
          generatorOpts: {
            ...babelOptions.generatorOpts,
            decoratorsBeforeExport: true
          },
          plugins,
          sourceMaps: true,
          // Vite handles sourcemap flattening
          inputSourceMap: inputMap ?? (false as any)
        })

        if (result) {
          let code = result.code!
          if (useFastRefresh && /\$RefreshReg\$\(/.test(code)) {
            const accept = isReasonReact || isRefreshBoundary(result.ast!)
            code = addRefreshWrapper(code, id, accept)
          }
          return {
            code,
            map: result.map
          }
        }
      }
    }
  }

  const viteReactRefresh: Plugin = {
    name: 'vite:react-refresh',
    enforce: 'pre',
    config: () => ({
      resolve: {
        dedupe: ['react', 'react-dom']
      }
    }),
    resolveId(id) {
      if (id === runtimePublicPath) {
        return id
      }
    },
    load(id) {
      if (id === runtimePublicPath) {
        return runtimeCode
      }
    },
    transformIndexHtml() {
      if (!skipFastRefresh)
        return [
          {
            tag: 'script',
            attrs: { type: 'module' },
            children: preambleCode.replace(`__BASE__`, devBase)
          }
        ]
    }
  }

  const reactJsxRuntimeId = 'react/jsx-runtime'
  const reactJsxDevRuntimeId = 'react/jsx-dev-runtime'
  const virtualReactJsxRuntimeId = '\0' + reactJsxRuntimeId
  const virtualReactJsxDevRuntimeId = '\0' + reactJsxDevRuntimeId
  // Adapted from https://github.com/alloc/vite-react-jsx
  const viteReactJsx: Plugin = {
    name: 'vite:react-jsx',
    enforce: 'pre',
    config() {
      return {
        optimizeDeps: {
          // We can't add `react-dom` because the dependency is `react-dom/client`
          // for React 18 while it's `react-dom` for React 17. We'd need to detect
          // what React version the user has installed.
          include: [reactJsxRuntimeId, reactJsxDevRuntimeId, 'react']
        }
      }
    },
    resolveId(id, importer) {
      // Resolve runtime to a virtual path to be interoped.
      // Since the interop code re-imports `id`, we need to prevent re-resolving
      // to the virtual id if the importer is already the virtual id.
      if (id === reactJsxRuntimeId && importer !== virtualReactJsxRuntimeId) {
        return virtualReactJsxRuntimeId
      }
      if (
        id === reactJsxDevRuntimeId &&
        importer !== virtualReactJsxDevRuntimeId
      ) {
        return virtualReactJsxDevRuntimeId
      }
    },
    load(id) {
      // Apply manual interop
      if (id === virtualReactJsxRuntimeId) {
        return [
          `import * as jsxRuntime from ${JSON.stringify(reactJsxRuntimeId)}`,
          `export const Fragment = jsxRuntime.Fragment`,
          `export const jsx = jsxRuntime.jsx`,
          `export const jsxs = jsxRuntime.jsxs`
        ].join('\n')
      }
      if (id === virtualReactJsxDevRuntimeId) {
        return [
          `import * as jsxRuntime from ${JSON.stringify(reactJsxDevRuntimeId)}`,
          `export const Fragment = jsxRuntime.Fragment`,
          `export const jsxDEV = jsxRuntime.jsxDEV`
        ].join('\n')
      }
    }
  }

  return [viteBabel, viteReactRefresh, useAutomaticRuntime && viteReactJsx]
}

viteReact.preambleCode = preambleCode

function loadPlugin(path: string): Promise<any> {
  return import(path).then((module) => module.default || module)
}

function createBabelOptions(rawOptions?: BabelOptions) {
  const babelOptions = {
    babelrc: false,
    configFile: false,
    ...rawOptions
  } as ReactBabelOptions

  babelOptions.plugins ||= []
  babelOptions.presets ||= []
  babelOptions.overrides ||= []
  babelOptions.parserOpts ||= {} as any
  babelOptions.parserOpts.plugins ||= []

  return babelOptions
}
