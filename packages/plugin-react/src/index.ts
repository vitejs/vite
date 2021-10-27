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
  babel?: TransformOptions
  /**
   * @deprecated Use `babel.parserOpts.plugins` instead
   */
  parserPlugins?: ParserOptions['plugins']
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

  const userPlugins = opts.babel?.plugins || []
  const userParserPlugins =
    opts.parserPlugins || opts.babel?.parserOpts?.plugins || []

  // Support pattens like:
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
    async transform(code, id, ssr) {
      // File extension could be mocked/overriden in querystring.
      const [filepath, querystring = ''] = id.split('?')
      const [extension = ''] =
        querystring.match(fileExtensionRE) ||
        filepath.match(fileExtensionRE) ||
        []

      if (/\.(mjs|[tj]sx?)$/.test(extension)) {
        const plugins = [...userPlugins]

        const parserPlugins: typeof userParserPlugins = [
          ...userParserPlugins,
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

        const isTypeScript = /\.tsx?$/.test(extension)
        if (isTypeScript) {
          parserPlugins.push('typescript')
        }

        const isNodeModules = id.includes('node_modules')

        let useFastRefresh = false
        if (!skipFastRefresh && !ssr && !isNodeModules) {
          // Modules with .js or .ts extension must import React.
          const isReactModule =
            extension.endsWith('x') || code.includes('react')
          if (isReactModule && filter(id)) {
            useFastRefresh = true
            plugins.push([
              await loadPlugin('react-refresh/babel.js'),
              { skipEnvCheck: true }
            ])
          }
        }

        let ast: t.File | null | undefined
        if (isNodeModules || extension.endsWith('x')) {
          if (useAutomaticRuntime) {
            // By reverse-compiling "React.createElement" calls into JSX,
            // React elements provided by dependencies will also use the
            // automatic runtime!
            const [restoredAst, isCommonJS] = isNodeModules
              ? await restoreJSX(babel, code, id)
              : [null, false]

            if (!isNodeModules || (ast = restoredAst)) {
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
          } else if (!isNodeModules) {
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

        const isReasonReact = extension.endsWith('.bs.js')

        const babelOpts: TransformOptions = {
          babelrc: false,
          configFile: false,
          ...opts.babel,
          ast: !isReasonReact,
          root: projectRoot,
          filename: id,
          sourceFileName: id,
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
          // Vite handles sourcemap flattening
          inputSourceMap: false as any
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
