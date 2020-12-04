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
import { isPlainObject, lookupFile } from './utils'
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
  root: string
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
  alias: Record<string, string>
  /**
   * Function that tests a file path for inclusion as a static asset.
   */
  assetsInclude?: (file: string) => boolean
  /**
   * Custom file transforms.
   */
  transforms: Transform[]
  /**
   * Custom index.html transforms.
   */
  indexHtmlTransforms: IndexHtmlTransform[]
  /**
   * Define global variable replacements.
   * Entries will be defined on `window` during dev and replaced during build.
   */
  define: Record<string, any>
  /**
   * Resolvers to map dev server public path requests to/from file system paths,
   * and optionally map module ids to public path requests.
   */
  resolvers: Resolver[]
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
  optimizeDeps: DepOptimizationOptions
  /**
   * Options to pass to `@vue/compiler-dom`
   *
   * https://github.com/vuejs/vue-next/blob/master/packages/compiler-core/src/options.ts
   */
  vueCompilerOptions: CompilerOptions
  /**
   * Configure what tags/attributes to trasnform into asset url imports,
   * or disable the transform altogether with `false`.
   */
  vueTransformAssetUrls: SFCTemplateCompileOptions['transformAssetUrls']
  /**
   * The options for template block preprocessor render.
   */
  vueTemplatePreprocessOptions: Record<
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
  vueCustomBlockTransforms: Record<string, CustomBlockTransform>
  /**
   * Configure what to use for jsx factory and fragment.
   * @default 'vue'
   */
  jsx:
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
  mode: string
  /**
   * CSS preprocess options
   */
  cssPreprocessOptions: CssPreprocessOptions
  /**
   * CSS modules options
   */
  cssModuleOptions: SFCAsyncStyleCompileOptions['modulesOptions']
  /**
   * Enable esbuild
   * @default true
   */
  enableEsbuild: boolean
  /**
   * Environment variables parsed from .env files
   * only ones starting with VITE_ are exposed on `import.meta.env`
   */
  env: DotenvParseOutput
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

export interface BuildConfig extends SharedConfig {
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

export interface UserConfig
  extends Partial<BuildConfig>,
    Partial<ServerConfig> {
  plugins?: Plugin[]
}

export type Plugin =
  | PluginConfig
  | ((config: ResolvedConfig) => PluginConfig | void)

export interface PluginConfig
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

export interface ResolvedConfig
  extends Omit<UserConfig, keyof SharedConfig>,
    SharedConfig {
  /** Path of config file */
  __path?: string
}

const debug = require('debug')('vite:config')

export async function resolveConfig(
  mode: string,
  configPath?: string,
  argv?: any
) {
  const start = Date.now()
  const cwd = process.cwd()

  let resolvedPath: string | undefined
  if (configPath) {
    resolvedPath = path.resolve(cwd, configPath)
  } else {
    const jsConfigPath = path.resolve(cwd, 'vite.config.js')
    if (fs.existsSync(jsConfigPath)) {
      resolvedPath = jsConfigPath
    } else {
      const tsConfigPath = path.resolve(cwd, 'vite.config.ts')
      if (fs.existsSync(tsConfigPath)) {
        resolvedPath = tsConfigPath
      }
    }
  }

  const config = { mode } as ResolvedConfig

  if (resolvedPath) {
    mergePlugin(config, await loadUserConfig(resolvedPath, mode))
  }

  // ensure plugin functions have access to the resolved root
  config.root =
    argv && argv.root
      ? path.resolve(argv.root)
      : config.root
      ? path.resolve(path.dirname(resolvedPath!), config.root)
      : process.cwd()

  // set default values before plugin functions are called
  config.alias ??= {}
  config.cssModuleOptions ??= {}
  config.cssPreprocessOptions ??= {}
  config.define ??= {}
  config.enableEsbuild ??= true
  config.env ??= {}
  config.indexHtmlTransforms ??= []
  config.jsx ??= 'vue'
  config.optimizeDeps ??= {}
  config.resolvers ??= []
  config.transforms ??= []
  config.vueCompilerOptions ??= {}
  config.vueCustomBlockTransforms ??= {}
  config.vueTransformAssetUrls ??= {}
  config.vueTemplatePreprocessOptions ??= {}

  if (config.plugins) {
    for (const plugin of config.plugins) {
      mergePlugin(config, plugin)
    }
  }

  // cli options take highest priority
  if (argv) {
    mergePlugin(config, argv)
  }

  const env = loadEnv(mode, config.root || cwd)
  Object.assign(config.env, env)

  debug(`config resolved in ${Date.now() - start}ms`)

  config.__path = resolvedPath
  return config
}

interface NodeModuleWithCompile extends NodeModule {
  _compile(code: string, filename: string): any
}

async function loadUserConfig(configPath: string, mode: string) {
  try {
    let config: UserConfig | ((mode: string) => UserConfig) | undefined

    if (!configPath.endsWith('.ts')) {
      try {
        config = require(configPath)
      } catch (e) {
        const ignored = /Cannot use import statement|Unexpected token 'export'|Must use import to load ES Module/
        if (!ignored.test(e.message)) {
          throw e
        }
      }
    }

    if (!config) {
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
        input: configPath,
        treeshake: false,
        plugins: [esbuildPlugin, nodeResolve, esbuildRenderChunkPlugin]
      })

      const {
        output: [{ code }]
      } = await bundle.generate({
        exports: 'named',
        format: 'cjs'
      })

      config = await loadConfigFromBundledFile(configPath, code)
    }

    return typeof config === 'function' ? config(mode) : config
  } catch (e) {
    console.error(chalk.red(`[vite] failed to load config from ${configPath}:`))
    console.error(e)
    process.exit(1)
  }
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

function mergePlugin(config: ResolvedConfig, plugin: Plugin) {
  if (typeof plugin === 'function') {
    plugin = plugin(config) || {}
  }
  for (const key in plugin) {
    let value = (plugin as any)[key]
    if (value == null) {
      continue
    }
    const oldValue = (config as any)[key]
    // normalize the asset url options before merging
    if (key === 'vueTransformAssetUrls') {
      if (isPlainObject(oldValue)) {
        if (isPlainObject(value))
          Object.assign(oldValue, normalizeAssetUrlOptions(value))
        continue // ignore boolean when object exists
      }
    }
    // let `true` take precedence
    else if (key === 'enableRollupPluginVue' && !value) {
      continue
    }
    // prefer merging into an existing array
    else if (Array.isArray(value)) {
      if (Array.isArray(oldValue)) {
        value.forEach((value) => oldValue.push(value))
        continue
      }
      // shallow clone to assume ownership
      value = [...value]
    }
    // prefer merging into an existing object (shallowly)
    else if (isPlainObject(value)) {
      if (isPlainObject(oldValue)) {
        const overrides: any = {}
        if (/^rollup(In|Out)putOptions$/.test(key)) {
          overrides.plugins = mergeArrays(
            (oldValue as any).plugins,
            (value as any).plugins
          )
          if (key === 'rollupInputOptions')
            overrides.acornInjectPlugins = mergeArrays(
              (oldValue as any).acornInjectPlugins,
              (value as any).acornInjectPlugins
            )
        }
        Object.assign(oldValue, value, overrides)
        continue
      }
      // shallow clone to assume ownership
      value = { ...value }
    }
    // overwrite when merging is unnecessary
    ;(config as any)[key] = value
  }
}

function mergeArrays(to: any, from: any) {
  return to ? (from ? [].concat(to, from) : to) : from
}

function normalizeAssetUrlOptions(o: Record<string, any> | undefined) {
  if (o && Object.values(o).some(Array.isArray)) {
    return { tags: o }
  } else {
    return o
  }
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
