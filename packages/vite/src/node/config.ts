import path from 'path'
import { TransformOptions } from 'esbuild'
import { Plugin as RollupPlugin } from 'rollup'
import { BuildOptions, BuildHook } from './commands/build'
import { ServerOptions, ServerHook } from './commands/serve'
import { CSSOptions } from './plugins/css'
import { deepMerge } from './utils'
import { internalPlugins } from './plugins'

export interface Config {
  /**
   * Project root directory. Can be an absolute path, or a path relative from
   * the location of the config file itself.
   * @default process.cwd()
   */
  root?: string
  /**
   * Environment mode
   */
  mode?: string
  /**
   * Import aliases
   */
  alias?: Record<string, string>
  /**
   * Define global variable replacements.
   * Entries will be defined on `window` during dev and replaced during build.
   */
  define?: Record<string, string>
  /**
   * CSS related options (preprocessors and CSS modules)
   */
  css?: CSSOptions
  /**
   * esbuild options (disable, jsx, minify)
   */
  esbuild?: ESBuildOptions | false
  /**
   * Vite plugins.
   */
  plugins?: Plugin[]
  build?: BuildOptions
  server?: ServerOptions
}

export { ServerOptions, BuildOptions, CSSOptions }

export type ESBuildOptions = Pick<
  TransformOptions,
  'target' | 'jsxFactory' | 'jsxFragment'
>

export interface Plugin extends RollupPlugin {
  enforce?: 'pre' | 'post'
  configureServer?: ServerHook | ServerHook[]
  configureBuild?: BuildHook | BuildHook[]
}

export interface ResolvedConfig extends Config {
  root: string
  mode: string
  env: Record<string, string>
  plugins: Plugin[]
  server: ServerOptions
  build: BuildOptions
}

export async function resolveConfig(
  config: Config,
  defaultMode: string,
  configPath?: string
): Promise<ResolvedConfig> {
  const fileConfig = await loadConfigFromFile(configPath)
  if (fileConfig) {
    config = deepMerge(fileConfig, config)
  }

  const { root, mode, plugins } = config

  // resolve plugins
  const prePlugins: Plugin[] = []
  const postPlugins: Plugin[] = []
  const normalPlugins: Plugin[] = []
  if (plugins) {
    plugins.forEach((p) => {
      if (p.enforce === 'pre') prePlugins.push(p)
      else if (p.enforce === 'post') postPlugins.push(p)
      else normalPlugins.push(p)
    })
  }
  const resolvedPlugins = [
    ...prePlugins,
    ...internalPlugins,
    ...normalPlugins,
    ...postPlugins
  ]

  return {
    ...config,
    root: root
      ? path.isAbsolute(root)
        ? root
        : path.resolve(root)
      : process.cwd(),
    mode: mode || defaultMode,
    plugins: resolvedPlugins,
    server: config.server || {},
    build: config.build || {},
    // TODO
    env: {}
  }
}

export async function loadConfigFromFile(configPath?: string): Promise<Config> {
  return {}
}
