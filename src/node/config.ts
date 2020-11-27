import path from 'path'
import fs from 'fs-extra'
import chalk from 'chalk'
import dotenv, { DotenvParseOutput } from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import { Options as RollupPluginVueOptions } from 'rollup-plugin-vue'
import {
  CompilerOptions,
  SFCStyleCompileOptions,
  SFCAsyncStyleCompileOptions,
  SFCTemplateCompileOptions
} from '@vue/compiler-sfc'
import Rollup, {
  InputOptions as RollupInputOptions,
  OutputOptions as RollupOutputOptions,
  Plugin as RollupPlugin,
  OutputChunk
} from 'rollup'
import {
  createEsbuildPlugin,
  createEsbuildRenderChunkPlugin
} from './build/buildPluginEsbuild'
import { BuildPlugin } from './build'
import { Context, ServerPlugin } from './server'
import { Resolver, supportedExts } from './resolver'
import {
  Transform,
  CustomBlockTransform,
  IndexHtmlTransform
} from './transform'
import { DepOptimizationOptions } from './optimizer'
import { ServerOptions } from 'https'
import { lookupFile } from './utils'
import { Options as RollupTerserOptions } from 'rollup-plugin-terser'
import { WatchOptions as chokidarWatchOptions } from 'chokidar'
import { ProxiesOptions } from './server/serverPluginProxy'

export type PreprocessLang = NonNullable<
  SFCStyleCompileOptions['preprocessLang']
>

export type PreprocessOptions = SFCStyleCompileOptions['preprocessOptions']

export type CssPreprocessOptions = Partial<
  Record<PreprocessLang, PreprocessOptions>
>

/**
 * https://github.com/koajs/cors#corsoptions
 */
export interface CorsOptions {
  /**
   * `Access-Control-Allow-Origin`, default is request Origin header
   */
  origin?: string | ((ctx: Context) => string)
  /**
   * `Access-Control-Allow-Methods`, default is 'GET,HEAD,PUT,POST,DELETE,PATCH'
   */
  allowMethods?: string | string[]
  /**
   * `Access-Control-Expose-Headers`
   */
  exposeHeaders?: string | string[]
  /**
   * `Access-Control-Allow-Headers`
   */
  allowHeaders?: string | string[]
  /**
   * `Access-Control-Max-Age` in seconds
   */
  maxAge?: string | number
  /**
   * `Access-Control-Allow-Credentials`, default is false
   */
  credentials?: boolean | ((ctx: Context) => boolean)
  /**
   * Add set headers to `err.header` if an error is thrown
   */
  keepHeadersOnError?: boolean
}

export { Resolver, Transform }

/**
 * Options shared between server and build.
 */
export interface SharedConfig {
  /**
   * Project root directory. Can be an absolute path, or a path relative from
   * the location of the config file itself.
   * @default process.cwd()
   */
  root?: string
  /**
   * Import alias. The entries can either be exact request -> request mappings
   * (exact, no wildcard syntax), or request path -> fs directory mappings.
   * When using directory mappings, the key **must start and end with a slash**.
   *
   * Example `vite.config.js`:
   * ``` js
   * module.exports = {
   *   alias: {
   *     // alias package names
   *     'react': '@pika/react',
   *     'react-dom': '@pika/react-dom'
   *
   *     // alias a path to a fs directory
   *     // the key must start and end with a slash
   *     '/@foo/': path.resolve(__dirname, 'some-special-dir')
   *   }
   * }
   * ```
   */
  alias?: Record<string, string>
  /**
   * Function that tests a file path for inclusion as a static asset.
   */
  assetsInclude?: (file: string) => boolean
  /**
   * Custom file transforms.
   */
  transforms?: Transform[]
  /**
   * Custom index.html transforms.
   */
  indexHtmlTransforms?: IndexHtmlTransform[]
  /**
   * Define global variable replacements.
   * Entries will be defined on `window` during dev and replaced during build.
   */
  define?: Record<string, any>
  /**
   * Resolvers to map dev server public path requests to/from file system paths,
   * and optionally map module ids to public path requests.
   */
  resolvers?: Resolver[]
  /**
   * Configure dep optimization behavior.
   *
   * Example `vite.config.js`:
   * ``` js
   * module.exports = {
   *   optimizeDeps: {
   *     exclude: ['dep-a', 'dep-b']
   *   }
   * }
   * ```
   */
  optimizeDeps?: DepOptimizationOptions
  /**
   * Options to pass to `@vue/compiler-dom`
   *
   * https://github.com/vuejs/vue-next/blob/master/packages/compiler-core/src/options.ts
   */
  vueCompilerOptions?: CompilerOptions
  /**
   * Configure what tags/attributes to trasnform into asset url imports,
   * or disable the transform altogether with `false`.
   */
  vueTransformAssetUrls?: SFCTemplateCompileOptions['transformAssetUrls']
  /**
   * The options for template block preprocessor render.
   */
  vueTemplatePreprocessOptions?: Record<
    string,
    SFCTemplateCompileOptions['preprocessOptions']
  >
  /**
   * Transform functions for Vue custom blocks.
   *
   * Example `vue.config.js`:
   * ``` js
   * module.exports = {
   *   vueCustomBlockTransforms: {
   *     i18n: src => `export default Comp => { ... }`
   *   }
   * }
   * ```
   */
  vueCustomBlockTransforms?: Record<string, CustomBlockTransform>
  /**
   * Configure what to use for jsx factory and fragment.
   * @default 'vue'
   */
  jsx?:
    | 'vue'
    | 'preact'
    | 'react'
    | {
        factory?: string
        fragment?: string
      }
  /**
   * Environment mode
   */
  mode?: string
  /**
   * CSS preprocess options
   */
  cssPreprocessOptions?: CssPreprocessOptions
  /**
   * CSS modules options
   */
  cssModuleOptions?: SFCAsyncStyleCompileOptions['modulesOptions']
  /**
   * Enable esbuild
   * @default true
   */
  enableEsbuild?: boolean
  /**
   * Environment variables parsed from .env files
   * only ones starting with VITE_ are exposed on `import.meta.env`
   * @internal
   */
  env?: DotenvParseOutput
}

export interface HmrConfig {
  protocol?: string
  hostname?: string
  port?: number
  path?: string
  /**
   * If you are using hmr ws proxy, it maybe timeout with your proxy program.
   * You can set this option to let client send ping socket to keep connection alive.
   * The option use `millisecond` as unit.
   * @default 30000ms
   */
  timeout?: number
}

export interface ServerConfig extends SharedConfig {
  /**
   * Configure hmr websocket connection.
   */
  hmr?: HmrConfig | boolean
  /**
   * Configure dev server hostname.
   */
  hostname?: string
  port?: number
  open?: boolean
  /**
   * Configure https.
   */
  https?: boolean
  httpsOptions?: ServerOptions
  /**
   * Configure custom proxy rules for the dev server. Uses
   * [`koa-proxies`](https://github.com/vagusX/koa-proxies) which in turn uses
   * [`http-proxy`](https://github.com/http-party/node-http-proxy). Each key can
   * be a path Full options
   * [here](https://github.com/http-party/node-http-proxy#options).
   *
   * Example `vite.config.js`:
   * ``` js
   * module.exports = {
   *   proxy: {
   *     // string shorthand
   *     '/foo': 'http://localhost:4567/foo',
   *     // with options
   *     '/api': {
   *       target: 'http://jsonplaceholder.typicode.com',
   *       changeOrigin: true,
   *       rewrite: path => path.replace(/^\/api/, '')
   *     }
   *   }
   * }
   * ```
   */
  proxy?: Record<string, string | ProxiesOptions>
  /**
   * Configure CORS for the dev server.
   * Uses [@koa/cors](https://github.com/koajs/cors).
   * Set to `true` to allow all methods from any origin, or configure separately
   * using an object.
   */
  cors?: CorsOptions | boolean
  /**
   * A plugin function that configures the dev server. Receives a server plugin
   * context object just like the internal server plugins. Can also be an array
   * of multiple server plugin functions.
   */
  configureServer?: ServerPlugin | ServerPlugin[]
  /**
   * The watch option passed to `chokidar`.
   */
  chokidarWatchOptions?: chokidarWatchOptions
}

export interface BuildConfig extends Required<SharedConfig> {
  /**
   * Entry. Use this to specify a js entry file in use cases where an
   * `index.html` does not exist (e.g. serving vite assets from a different host)
   * @default 'index.html'
   */
  entry: string
  /**
   * Base public path when served in production.
   * @default '/'
   */
  base: string
  /**
   * Directory relative from `root` where build output will be placed. If the
   * directory exists, it will be removed before the build.
   * @default 'dist'
   */
  outDir: string
  /**
   * Directory relative from `outDir` where the built js/css/image assets will
   * be placed.
   * @default '_assets'
   */
  assetsDir: string
  /**
   * Static asset files smaller than this number (in bytes) will be inlined as
   * base64 strings. Default limit is `4096` (4kb). Set to `0` to disable.
   * @default 4096
   */
  assetsInlineLimit: number
  /**
   * Whether to code-split CSS. When enabled, CSS in async chunks will be
   * inlined as strings in the chunk and inserted via dynamically created
   * style tags when the chunk is loaded.
   * @default true
   */
  cssCodeSplit: boolean
  /**
   * Whether to generate sourcemap
   * @default false
   */
  sourcemap: boolean | 'inline'
  /**
   * Set to `false` to disable minification, or specify the minifier to use.
   * Available options are 'terser' or 'esbuild'.
   * @default 'terser'
   */
  minify: boolean | 'terser' | 'esbuild'
  /**
   * The option for `terser`
   */
  terserOptions: RollupTerserOptions
  /**
   * Transpile target for esbuild.
   * @default 'es2020'
   */
  esbuildTarget: string
  /**
   * Build for server-side rendering, only as a CLI flag
   * for programmatic usage, use `ssrBuild` directly.
   * @internal
   */
  ssr?: boolean

  // The following are API / config only and not documented in the CLI. --------
  /**
   * Will be passed to rollup.rollup()
   *
   * https://rollupjs.org/guide/en/#big-list-of-options
   */
  rollupInputOptions: ViteRollupInputOptions
  /**
   * Will be passed to bundle.generate()
   *
   * https://rollupjs.org/guide/en/#big-list-of-options
   */
  rollupOutputOptions: RollupOutputOptions
  /**
   * Will be passed to rollup-plugin-vue
   *
   * https://github.com/vuejs/rollup-plugin-vue/blob/next/src/index.ts
   */
  rollupPluginVueOptions: Partial<RollupPluginVueOptions>
  /**
   * Will be passed to @rollup/plugin-node-resolve
   * https://github.com/rollup/plugins/tree/master/packages/node-resolve#dedupe
   */
  rollupDedupe: string[]
  /**
   * Whether to log asset info to console
   * @default false
   */
  silent: boolean
  /**
   * Whether to write bundle to disk
   * @default true
   */
  write: boolean
  /**
   * Whether to emit index.html
   * @default true
   */
  emitIndex: boolean
  /**
   * Whether to emit assets other than JavaScript
   * @default true
   */
  emitAssets: boolean
  /**
   * Whether to emit a manifest.json under assets dir to map hash-less filenames
   * to their hashed versions. Useful when you want to generate your own HTML
   * instead of using the one generated by Vite.
   *
   * Example:
   *
   * ```json
   * {
   *   "main.js": "main.68fe3fad.js",
   *   "style.css": "style.e6b63442.css"
   * }
   * ```
   * @default false
   */
  emitManifest?: boolean
  /**
   * Predicate function that determines whether a link rel=modulepreload shall be
   * added to the index.html for the chunk passed in
   */
  shouldPreload: ((chunk: OutputChunk) => boolean) | null
  /**
   * Enable 'rollup-plugin-vue'
   * @default true
   */
  enableRollupPluginVue?: boolean
  /**
   * Plugin functions that mutate the Vite build config. The `builds` array can
   * be added to if the plugin wants to add another Rollup build that Vite writes
   * to disk. Return a function to gain access to each build's output.
   * @internal
   */
  configureBuild?: BuildPlugin | BuildPlugin[]
}

export interface ViteRollupInputOptions extends RollupInputOptions {
  /**
   * @deprecated use `pluginsPreBuild` or `pluginsPostBuild` instead
   */
  plugins?: RollupPlugin[]
  /**
   * Rollup plugins that passed before Vite's transform plugins
   */
  pluginsPreBuild?: RollupPlugin[]
  /**
   * Rollup plugins that passed after Vite's transform plugins
   */
  pluginsPostBuild?: RollupPlugin[]
  /**
   * Rollup plugins for optimizer
   */
  pluginsOptimizer?: RollupPlugin[]
}

export interface UserConfig extends Partial<BuildConfig>, ServerConfig {
  plugins?: Plugin[]
}

export interface Plugin
  extends Pick<
    UserConfig,
    | 'alias'
    | 'transforms'
    | 'indexHtmlTransforms'
    | 'define'
    | 'resolvers'
    | 'configureBuild'
    | 'configureServer'
    | 'vueCompilerOptions'
    | 'vueTransformAssetUrls'
    | 'vueTemplatePreprocessOptions'
    | 'vueCustomBlockTransforms'
    | 'rollupInputOptions'
    | 'rollupOutputOptions'
    | 'enableRollupPluginVue'
  > {}

export type ResolvedConfig = UserConfig & {
  env: DotenvParseOutput
  /**
   * Path of config file.
   */
  __path?: string
}

const debug = require('debug')('vite:config')

export async function resolveConfig(mode: string, configPath?: string) {
  const start = Date.now()
  const cwd = process.cwd()

  let resolvedPath: string | undefined
  let isTS = false
  if (configPath) {
    resolvedPath = path.resolve(cwd, configPath)
  } else {
    const jsConfigPath = path.resolve(cwd, 'vite.config.js')
    if (fs.existsSync(jsConfigPath)) {
      resolvedPath = jsConfigPath
    } else {
      const tsConfigPath = path.resolve(cwd, 'vite.config.ts')
      if (fs.existsSync(tsConfigPath)) {
        isTS = true
        resolvedPath = tsConfigPath
      }
    }
  }

  if (!resolvedPath) {
    // load environment variables
    return {
      env: loadEnv(mode, cwd)
    }
  }

  try {
    let userConfig: UserConfig | ((mode: string) => UserConfig) | undefined

    if (!isTS) {
      try {
        userConfig = require(resolvedPath)
      } catch (e) {
        const ignored = /Cannot use import statement|Unexpected token 'export'|Must use import to load ES Module/
        if (!ignored.test(e.message)) {
          throw e
        }
      }
    }

    if (!userConfig) {
      // 2. if we reach here, the file is ts or using es import syntax, or
      // the user has type: "module" in their package.json (#917)
      // transpile es import syntax to require syntax using rollup.
      const rollup = require('rollup') as typeof Rollup
      const esbuildPlugin = await createEsbuildPlugin({})
      const esbuildRenderChunkPlugin = createEsbuildRenderChunkPlugin(
        'es2019',
        false
      )
      // use node-resolve to support .ts files
      const nodeResolve = require('@rollup/plugin-node-resolve').nodeResolve({
        extensions: supportedExts
      })
      const bundle = await rollup.rollup({
        external: (id: string) =>
          (id[0] !== '.' && !path.isAbsolute(id)) ||
          id.slice(-5, id.length) === '.json',
        input: resolvedPath,
        treeshake: false,
        plugins: [esbuildPlugin, nodeResolve, esbuildRenderChunkPlugin]
      })

      const {
        output: [{ code }]
      } = await bundle.generate({
        exports: 'named',
        format: 'cjs'
      })

      userConfig = await loadConfigFromBundledFile(resolvedPath, code)
    }

    let config = (typeof userConfig === 'function'
      ? userConfig(mode)
      : userConfig) as ResolvedConfig

    // resolve plugins
    if (config.plugins) {
      for (const plugin of config.plugins) {
        config = resolvePlugin(config, plugin) as any
      }
    }

    // normalize config root to absolute
    if (config.root && !path.isAbsolute(config.root)) {
      config.root = path.resolve(path.dirname(resolvedPath), config.root)
    }

    if (typeof config.vueTransformAssetUrls === 'object') {
      config.vueTransformAssetUrls = normalizeAssetUrlOptions(
        config.vueTransformAssetUrls
      )
    }

    const env = loadEnv(mode, config.root || cwd)
    config.env = {
      ...config.env,
      ...env
    }
    debug(`config resolved in ${Date.now() - start}ms`)

    config.__path = resolvedPath
    return config
  } catch (e) {
    console.error(
      chalk.red(`[vite] failed to load config from ${resolvedPath}:`)
    )
    console.error(e)
    process.exit(1)
  }
}

interface NodeModuleWithCompile extends NodeModule {
  _compile(code: string, filename: string): any
}

async function loadConfigFromBundledFile(
  fileName: string,
  bundledCode: string
): Promise<UserConfig> {
  const extension = path.extname(fileName)
  const defaultLoader = require.extensions[extension]!
  require.extensions[extension] = (module: NodeModule, filename: string) => {
    if (filename === fileName) {
      ;(module as NodeModuleWithCompile)._compile(bundledCode, filename)
    } else {
      defaultLoader(module, filename)
    }
  }
  delete require.cache[fileName]
  const raw = require(fileName)
  const config = raw.__esModule ? raw.default : raw
  require.extensions[extension] = defaultLoader
  return config
}

function resolvePlugin(config: UserConfig, plugin: Plugin): UserConfig {
  return {
    ...config,
    ...plugin,
    alias: {
      ...plugin.alias,
      ...config.alias
    },
    define: {
      ...plugin.define,
      ...config.define
    },
    transforms: [...(config.transforms || []), ...(plugin.transforms || [])],
    indexHtmlTransforms: [
      ...(config.indexHtmlTransforms || []),
      ...(plugin.indexHtmlTransforms || [])
    ],
    resolvers: [...(config.resolvers || []), ...(plugin.resolvers || [])],
    configureServer: ([] as ServerPlugin[]).concat(
      config.configureServer || [],
      plugin.configureServer || []
    ),
    configureBuild: ([] as BuildPlugin[]).concat(
      config.configureBuild || [],
      plugin.configureBuild || []
    ),
    vueCompilerOptions: {
      ...config.vueCompilerOptions,
      ...plugin.vueCompilerOptions
    },
    vueTransformAssetUrls: mergeAssetUrlOptions(
      config.vueTransformAssetUrls,
      plugin.vueTransformAssetUrls
    ),
    vueTemplatePreprocessOptions: {
      ...config.vueTemplatePreprocessOptions,
      ...plugin.vueTemplatePreprocessOptions
    },
    vueCustomBlockTransforms: {
      ...config.vueCustomBlockTransforms,
      ...plugin.vueCustomBlockTransforms
    },
    rollupInputOptions: mergeObjectOptions(
      config.rollupInputOptions,
      plugin.rollupInputOptions
    ),
    rollupOutputOptions: mergeObjectOptions(
      config.rollupOutputOptions,
      plugin.rollupOutputOptions
    ),
    enableRollupPluginVue:
      config.enableRollupPluginVue || plugin.enableRollupPluginVue
  }
}

function mergeAssetUrlOptions(
  to: SFCTemplateCompileOptions['transformAssetUrls'],
  from: SFCTemplateCompileOptions['transformAssetUrls']
): SFCTemplateCompileOptions['transformAssetUrls'] {
  if (from === true) {
    return to
  }
  if (from === false) {
    return from
  }
  if (typeof to === 'boolean') {
    return from || to
  }
  return {
    ...normalizeAssetUrlOptions(to),
    ...normalizeAssetUrlOptions(from)
  }
}

function normalizeAssetUrlOptions(o: Record<string, any> | undefined) {
  if (o && Object.keys(o).some((key) => Array.isArray(o[key]))) {
    return {
      tags: o
    }
  } else {
    return o
  }
}

function mergeObjectOptions(to: any, from: any) {
  if (!to) return from
  if (!from) return to
  const res: any = { ...to }
  for (const key in from) {
    const existing = res[key]
    const toMerge = from[key]
    if (Array.isArray(existing) || Array.isArray(toMerge)) {
      res[key] = [].concat(existing, toMerge).filter(Boolean)
    } else {
      res[key] = toMerge
    }
  }
  return res
}

export function loadEnv(mode: string, root: string, prefix = 'VITE_') {
  if (mode === 'local') {
    throw new Error(
      `"local" cannot be used as a mode name because it conflicts with ` +
        `the .local postfix for .env files.`
    )
  }

  debug(`env mode: ${mode}`)

  const env: DotenvParseOutput = {}
  const envFiles = [
    /** mode local file */ `.env.${mode}.local`,
    /** mode file */ `.env.${mode}`,
    /** local file */ `.env.local`,
    /** default file */ `.env`
  ]

  for (const file of envFiles) {
    const path = lookupFile(root, [file], true)
    if (path) {
      const parsed = dotenv.parse(fs.readFileSync(path), {
        debug: !!process.env.DEBUG || undefined
      })

      // let environment variables use each other
      dotenvExpand({
        parsed,
        // prevent process.env mutation
        ignoreProcessEnv: true
      } as any)

      // only keys that start with prefix are exposed.
      for (const [key, value] of Object.entries(parsed)) {
        if (key.startsWith(prefix) && env[key] === undefined) {
          env[key] = value
        }
      }
    }
  }

  debug(`env: %O`, env)
  return env
}

// TODO move this into Vue plugin when we extract it
export const defaultDefines = {
  __VUE_OPTIONS_API__: true,
  __VUE_PROD_DEVTOOLS__: false
}
