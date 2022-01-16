import type { ParserOptions, TransformOptions, types as t } from '@babel/core'
import * as babel from '@babel/core'
import { createFilter } from '@rollup/pluginutils'
import resolve from 'resolve'
import type { Plugin, PluginOption } from 'vite'
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
   * Babel configuration applied in both dev and prod.
   */
  babel?: BabelOptions
  /**
   * @deprecated Use `babel.parserOpts.plugins` instead
   */
  parserPlugins?: ParserOptions['plugins']
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
  parserOpts: ParserOptions & {
    plugins: Extract<ParserOptions['plugins'], any[]>
  }
}

declare module 'vite' {
  export interface Plugin {
    api?: {
      /**
       * Manipulate the Babel options of `@vitejs/plugin-react`
       */
      reactBabel?: (options: ReactBabelOptions, config: ResolvedConfig) => void
    }
  }
}

export default function viteReact(opts: Options = {}): PluginOption[] {
  // Provide default values for Rollup compat.
  let base = '/'
  let filter = createFilter(opts.include, opts.exclude)
  let isProduction = true
  let projectRoot = process.cwd()
  let skipFastRefresh = opts.fastRefresh === false
  let skipReactImport = false

  const useAutomaticRuntime = opts.jsxRuntime !== 'classic'

  const babelOptions = {
    babelrc: false,
    configFile: false,
    ...opts.babel
  } as ReactBabelOptions

  babelOptions.plugins ||= []
  babelOptions.presets ||= []
  babelOptions.parserOpts ||= {} as any
  babelOptions.parserOpts.plugins ||= opts.parserPlugins || []

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
    configResolved(config) {
      base = config.base
      projectRoot = config.root
      filter = createFilter(opts.include, opts.exclude, {
        resolve: projectRoot
      })
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

        if (plugin.api?.reactBabel) {
          plugin.api.reactBabel(babelOptions, config)
        }
      })
    },
    async transform(code, id, options) {
      const ssr = typeof options === 'boolean' ? options : options?.ssr === true
      // File extension could be mocked/overriden in querystring.
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

        const plugins = isProjectFile ? [...babelOptions.plugins] : []

        let useFastRefresh = false
        if (!skipFastRefresh && !ssr && !isNodeModules) {
          // Modules with .js or .ts extension must import React.
          const isReactModule = isJSX || importReactRE.test(code)
          if (isReactModule && filter(id)) {
            useFastRefresh = true
            plugins.push([
              await loadPlugin('react-refresh/babel.js'),
              { skipEnvCheck: true }
            ])
          }
        }

        let ast: t.File | null | undefined
        if (!isProjectFile || isJSX) {
          if (useAutomaticRuntime) {
            // By reverse-compiling "React.createElement" calls into JSX,
            // React elements provided by dependencies will also use the
            // automatic runtime!
            const [restoredAst, isCommonJS] =
              !isProjectFile && !isJSX
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
                  importSource: opts.jsxImportSource
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
              code = `import React from 'react'; ` + code
            }
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

        if (shouldSkip) {
          return // Avoid parsing if no plugins exist.
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
          inputSourceMap: false as any
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
            children: preambleCode.replace(`__BASE__`, base)
          }
        ]
    }
  }

  const runtimeId = 'react/jsx-runtime'
  // Adapted from https://github.com/alloc/vite-react-jsx
  const viteReactJsx: Plugin = {
    name: 'vite:react-jsx',
    enforce: 'pre',
    config() {
      return {
        optimizeDeps: {
          include: ['react/jsx-dev-runtime']
        }
      }
    },
    resolveId(id: string) {
      return id === runtimeId ? id : null
    },
    load(id: string) {
      if (id === runtimeId) {
        const runtimePath = resolve.sync(runtimeId, {
          basedir: projectRoot
        })
        const exports = ['jsx', 'jsxs', 'Fragment']
        return [
          `import * as jsxRuntime from ${JSON.stringify(runtimePath)}`,
          // We can't use `export * from` or else any callsite that uses
          // this module will be compiled to `jsxRuntime.exports.jsx`
          // instead of the more concise `jsx` alias.
          ...exports.map((name) => `export const ${name} = jsxRuntime.${name}`)
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

// overwrite for cjs require('...')() usage
module.exports = viteReact
viteReact['default'] = viteReact
