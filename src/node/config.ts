import path from 'path'
import fs from 'fs-extra'
import chalk from 'chalk'
import { createEsbuildPlugin } from './build/buildPluginEsbuild'
import { ServerPlugin } from './server'
import { Resolver } from './resolver'
import { Options as RollupPluginVueOptions } from 'rollup-plugin-vue'
import { CompilerOptions } from '@vue/compiler-sfc'
import Rollup, {
  InputOptions as RollupInputOptions,
  OutputOptions as RollupOutputOptions
} from 'rollup'

export { Resolver }

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
   * TODO
   */
  alias?: Record<string, string>
  /**
   * TODO
   */
  transforms?: Transform[]
  /**
   * Resolvers to map dev server public path requests to/from file system paths,
   * and optionally map module ids to public path requests.
   */
  resolvers?: Resolver[]
  /**
   * Options to pass to @vue/compiler-dom
   */
  vueCompilerOptions?: CompilerOptions
  /**
   * Configure what to use for jsx factory and fragment.
   * @default
   * {
   *   factory: 'React.createElement',
   *   fragment: 'React.Fragment'
   * }
   */
  jsx?: {
    factory?: string
    fragment?: string
  }
}

export interface ServerConfig extends SharedConfig {
  plugins?: ServerPlugin[]
}

export interface BuildConfig extends SharedConfig {
  /**
   * Base public path when served in production.
   * @default '/'
   */
  base?: string
  /**
   * Directory relative from `root` where build output will be placed. If the
   * directory exists, it will be removed before the build.
   * @default 'dist'
   */
  outDir?: string
  /**
   * Directory relative from `outDir` where the built js/css/image assets will
   * be placed.
   * @default 'assets'
   */
  assetsDir?: string
  /**
   * Static asset files smaller than this number (in bytes) will be inlined as
   * base64 strings. Default limit is `4096` (4kb). Set to `0` to disable.
   * @default 4096
   */
  assetsInlineLimit?: number
  /**
   * Whether to generate sourcemap
   * @default false
   */
  sourcemap?: boolean
  /**
   * Set to `false` to dsiable minification, or specify the minifier to use.
   * Available options are 'terser' or 'esbuild'.
   * @default 'terser'
   */
  minify?: boolean | 'terser' | 'esbuild'
  /**
   * Build for server-side rendering
   * @default false
   */
  ssr?: boolean

  // The following are API only and not documented in the CLI. -----------------
  /**
   * Will be passed to rollup.rollup()
   * https://rollupjs.org/guide/en/#big-list-of-options
   */
  rollupInputOptions?: RollupInputOptions
  /**
   * Will be passed to bundle.generate()
   * https://rollupjs.org/guide/en/#big-list-of-options
   */
  rollupOutputOptions?: RollupOutputOptions
  /**
   * Will be passed to rollup-plugin-vue
   * https://github.com/vuejs/rollup-plugin-vue/blob/next/src/index.ts
   */
  rollupPluginVueOptions?: Partial<RollupPluginVueOptions>
  /**
   * Whether to log asset info to console
   * @default false
   */
  silent?: boolean
  /**
   * Whether to write bundle to disk
   * @default true
   */
  write?: boolean
  /**
   * Whether to emit index.html
   * @default true
   */
  emitIndex?: boolean
  /**
   * Whether to emit assets other than JavaScript
   * @default true
   */
  emitAssets?: boolean
}

export interface UserConfig extends BuildConfig {
  configureServer?: ServerPlugin
  plugins?: Plugin[]
}

export type Condition = RegExp | RegExp[] | (() => boolean)

export interface Transform {
  include?: Condition
  exclude?: Condition
  query?: Condition
  /**
   * @default 'js'
   */
  as?: 'js' | 'css'
  transform?: (code: string) => string | Promise<string>
}

export interface Plugin
  extends Pick<
    UserConfig,
    | 'alias'
    | 'transforms'
    | 'resolvers'
    | 'configureServer'
    | 'vueCompilerOptions'
    | 'rollupInputOptions'
    | 'rollupOutputOptions'
  > {}

export async function resolveConfig(
  configPath: string | undefined
): Promise<UserConfig | undefined> {
  const start = Date.now()
  const resolvedPath = path.resolve(
    process.cwd(),
    configPath || 'vite.config.js'
  )
  try {
    if (await fs.pathExists(resolvedPath)) {
      let config: UserConfig | undefined
      const isTs = path.extname(resolvedPath) === '.ts'
      // 1. try loading the config file directly
      if (!isTs) {
        try {
          config = require(resolvedPath)
        } catch (e) {
          if (
            !/Cannot use import statement|Unexpected token 'export'/.test(
              e.message
            )
          ) {
            throw e
          }
        }
      }

      if (!config) {
        // 2. if we reach here, the file is ts or using es import syntax.
        // transpile es import syntax to require syntax using rollup.
        const rollup = require('rollup') as typeof Rollup
        const esbuilPlugin = await createEsbuildPlugin(false, {})
        const bundle = await rollup.rollup({
          external: (id: string) =>
            (id[0] !== '.' && !path.isAbsolute(id)) ||
            id.slice(-5, id.length) === '.json',
          input: resolvedPath,
          treeshake: false,
          plugins: [esbuilPlugin]
        })

        const {
          output: [{ code }]
        } = await bundle.generate({
          exports: 'named',
          format: 'cjs'
        })

        config = await loadConfigFromBundledFile(resolvedPath, code)
      }

      // normalize config root to absolute
      if (config.root && !path.isAbsolute(config.root)) {
        config.root = path.resolve(path.dirname(resolvedPath), config.root)
      }

      // resolve plugins
      if (config.plugins) {
        for (const plugin of config.plugins) {
          config = resolvePlugin(config, plugin)
        }
      }

      require('debug')('vite:config')(
        `config resolved in ${Date.now() - start}ms`
      )
      console.log(config)
      return config
    }
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
    alias: {
      ...plugin.alias,
      ...config.alias
    },
    transforms: [...(config.transforms || []), ...(plugin.transforms || [])],
    resolvers: [...(config.resolvers || []), ...(plugin.resolvers || [])],
    configureServer: (ctx) => {
      if (config.configureServer) {
        config.configureServer(ctx)
      }
      if (plugin.configureServer) {
        plugin.configureServer(ctx)
      }
    },
    vueCompilerOptions: {
      ...config.vueCompilerOptions,
      ...plugin.vueCompilerOptions
    },
    rollupInputOptions: {
      ...config.rollupInputOptions,
      ...plugin.rollupInputOptions
    },
    rollupOutputOptions: {
      ...config.rollupOutputOptions,
      ...plugin.rollupOutputOptions
    }
  }
}
