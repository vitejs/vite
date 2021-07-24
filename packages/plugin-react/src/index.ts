import type { ParserOptions, TransformOptions, types as t } from '@babel/core'
import * as babel from '@babel/core'
import { createFilter } from '@rollup/pluginutils'
import resolve from 'resolve'
import type { Logger, Plugin, PluginOption } from 'vite'
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
   * @default "classic"
   */
  jsxRuntime?: 'classic' | 'automatic'
  /**
   * Replaces the import source when importing functions when used with automatic jsx runtime.
   *
   * See https://babeljs.io/docs/en/babel-plugin-transform-react-jsx#importsource
   * @default "react"
   */
  jsxImportSource?: string

  /**
   * Babel configuration applied in both dev and prod.
   */
  babel?: TransformOptions
  /**
   * @deprecated Use `babel.parserOpts.plugins` instead
   */
  parserPlugins?: ParserOptions['plugins']
}

export default function viteReact(opts: Options = {}): PluginOption[] {
  let base = '/'
  let projectRoot = process.cwd()
  let isProduction = true
  let skipFastRefresh = opts.fastRefresh === false
  let filter = createFilter(opts.include, opts.exclude)
  let jsxInject: string | undefined
  let logger: Logger

  const userPlugins = opts.babel?.plugins || []
  const userParserPlugins =
    opts.parserPlugins || opts.babel?.parserOpts?.plugins || []

  const viteBabel: Plugin = {
    name: 'vite:react-babel',
    enforce: 'pre',
    configResolved(config) {
      jsxInject = config.esbuild ? config.esbuild.jsxInject : undefined
      logger = config.logger
    },
    async transform(code, id, ssr) {
      if (/\.[tj]sx?$/.test(id)) {
        const plugins = [...userPlugins]

        const parserPlugins: typeof userParserPlugins = [
          ...userParserPlugins,
          'jsx',
          'importMeta',
          // This plugin is applied before esbuild transforms the code,
          // so we need to enable some stage 3 syntax that is supported in
          // TypeScript and some environments already.
          'topLevelAwait',
          'classProperties',
          'classPrivateProperties',
          'classPrivateMethods'
        ]

        const isTypeScript = /\.tsx?$/.test(id)
        if (isTypeScript) {
          parserPlugins.push('typescript')
        }

        const isNodeModules = id.includes('node_modules')

        let useFastRefresh = false
        if (!skipFastRefresh && !ssr && !isNodeModules) {
          // Modules with .js or .ts extension must import React.
          const isReactModule = id.endsWith('x') || code.includes('react')
          if (isReactModule && filter(id)) {
            useFastRefresh = true
            plugins.push([
              await interopDefault(import('react-refresh/babel.js')),
              { skipEnvCheck: true }
            ])
          }
        }

        let ast: t.File | null | undefined
        if (id.endsWith('x')) {
          if (opts.jsxRuntime === 'automatic') {
            // By reverse-compiling "React.createElement" calls into JSX,
            // React elements provided by dependencies will also use the
            // automatic runtime!
            const [restoredAst, isCommonJS] = isNodeModules
              ? await restoreJSX(babel, code)
              : [null, false]

            ast = restoredAst

            plugins.push([
              await import('@babel/plugin-transform-react-jsx'),
              {
                runtime: 'automatic',
                importSource: opts.jsxImportSource
              }
            ])

            // Avoid inserting `import` statements into CJS modules.
            if (isCommonJS) {
              plugins.push(babelImportToRequire)
            }
          } else if (!isNodeModules) {
            // @babel/plugin-transform-react-jsx-self and
            // @babel/plugin-transform-react-jsx-source is not supported for
            // automatic runtime. See https://babeljs.io/docs/en/babel-preset-react
            if (!isNodeModules && !isProduction) {
              plugins.push(
                await interopDefault(
                  import('@babel/plugin-transform-react-jsx-self')
                ),
                await interopDefault(
                  import('@babel/plugin-transform-react-jsx-source')
                )
              )
            }

            // Even if the automatic JSX runtime is not used, we can still
            // inject the React import for .jsx and .tsx modules.
            const importReactRE = /(^|\n)import\s+(\*\s+as\s+)?React\s+/
            if (jsxInject && importReactRE.test(jsxInject)) {
              logger.warnOnce(
                '[@vitejs/plugin-react] This plugin imports React for you automatically,' +
                  ' so you can stop using `esbuild.jsxInject` for that purpose.'
              )
            } else if (!importReactRE.test(code)) {
              code = `import React from 'react'; ` + code
            }
          }
        }

        const isReasonReact = id.endsWith('.bs.js')

        const babelOpts: TransformOptions = {
          babelrc: false,
          configFile: false,
          ...opts.babel,
          ast: !isReasonReact,
          root: projectRoot,
          filename: id,
          parserOpts: {
            ...opts.babel?.parserOpts,
            sourceType: 'module',
            allowAwaitOutsideFunction: true,
            plugins: parserPlugins
          },
          generatorOpts: {
            ...opts.babel?.generatorOpts,
            decoratorsBeforeExport: true
          },
          plugins,
          sourceMaps: true,
          sourceFileName: id
        }

        const result = ast
          ? await babel.transformFromAstAsync(ast, code, babelOpts)
          : await babel.transformAsync(code, babelOpts)

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
    configResolved(config) {
      base = config.base
      projectRoot = config.root
      isProduction = config.isProduction
      skipFastRefresh = isProduction || config.command === 'build'
      filter = createFilter(opts.include, opts.exclude, {
        resolve: projectRoot
      })

      config.plugins.forEach(
        (plugin) =>
          (plugin.name === 'react-refresh' ||
            (plugin !== viteReactJsx && plugin.name === 'vite:react-jsx')) &&
          config.logger.warn(
            `[@vitejs/plugin-react] You should stop using "${plugin.name}" ` +
              `since this plugin conflicts with it.`
          )
      )
    },
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
    config: () => ({
      // react/jsx-runtime is in CJS format
      // we want to explicitly cast it to ESM
      optimizeDeps: {
        include: ['react/jsx-runtime']
      }
    }),
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
          `import * as jsxRuntime from '${runtimePath}'`,
          // We can't use `export * from` or else any callsite that uses
          // this module will be compiled to `jsxRuntime.exports.jsx`
          // instead of the more concise `jsx` alias.
          ...exports.map((name) => `export const ${name} = jsxRuntime.${name}`)
        ].join('\n')
      }
    }
  }

  return [
    viteBabel,
    viteReactRefresh,
    opts.jsxRuntime === 'automatic' && viteReactJsx
  ]
}

viteReact.preambleCode = preambleCode

function interopDefault(promise: Promise<any>): Promise<any> {
  return promise.then((module) => module.default || module)
}

// overwrite for cjs require('...')() usage
module.exports = viteReact
viteReact['default'] = viteReact
