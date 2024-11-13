import type {
  CustomPluginOptions,
  LoadResult,
  ObjectHook,
  ResolveIdResult,
  MinimalPluginContext as RollupMinimalPluginContext,
  Plugin as RollupPlugin,
  PluginContext as RollupPluginContext,
  TransformPluginContext as RollupTransformPluginContext,
  TransformResult,
} from 'rollup'
import type {
  ConfigEnv,
  EnvironmentOptions,
  ResolvedConfig,
  UserConfig,
} from './config'
import type { ServerHook } from './server'
import type { IndexHtmlTransform } from './plugins/html'
import type { EnvironmentModuleNode } from './server/moduleGraph'
import type { ModuleNode } from './server/mixedModuleGraph'
import type { HmrContext, HotUpdateOptions } from './server/hmr'
import type { DevEnvironment } from './server/environment'
import type { Environment } from './environment'
import type { PartialEnvironment } from './baseEnvironment'
import type { PreviewServerHook } from './preview'
import { arraify, asyncFlatten } from './utils'

/**
 * Vite plugins extends the Rollup plugin interface with a few extra
 * vite-specific options. A valid vite plugin is also a valid Rollup plugin.
 * On the contrary, a Rollup plugin may or may NOT be a valid vite universal
 * plugin, since some Rollup features do not make sense in an unbundled
 * dev server context. That said, as long as a rollup plugin doesn't have strong
 * coupling between its bundle phase and output phase hooks then it should
 * just work (that means, most of them).
 *
 * By default, the plugins are run during both serve and build. When a plugin
 * is applied during serve, it will only run **non output plugin hooks** (see
 * rollup type definition of {@link rollup#PluginHooks}). You can think of the
 * dev server as only running `const bundle = rollup.rollup()` but never calling
 * `bundle.generate()`.
 *
 * A plugin that expects to have different behavior depending on serve/build can
 * export a factory function that receives the command being run via options.
 *
 * If a plugin should be applied only for server or build, a function format
 * config file can be used to conditional determine the plugins to use.
 *
 * The current environment can be accessed from the context for the all non-global
 * hooks (it is not available in config, configResolved, configureServer, etc).
 * It can be a dev, build, or scan environment.
 * Plugins can use this.environment.mode === 'dev' to guard for dev specific APIs.
 */

export interface PluginContextExtension {
  /**
   * Vite-specific environment instance
   */
  environment: Environment
}

export interface HotUpdatePluginContext {
  environment: DevEnvironment
}

export interface MinimalPluginContext
  extends RollupMinimalPluginContext,
    PluginContextExtension {}

export interface PluginContext
  extends RollupPluginContext,
    PluginContextExtension {}

export interface ResolveIdPluginContext
  extends RollupPluginContext,
    PluginContextExtension {}

export interface TransformPluginContext
  extends RollupTransformPluginContext,
    PluginContextExtension {}

// Argument Rollup types to have the PluginContextExtension
declare module 'rollup' {
  export interface MinimalPluginContext extends PluginContextExtension {}
}

/**
 * There are two types of plugins in Vite. App plugins and environment plugins.
 * Environment Plugins are defined by a constructor function that will be called
 * once per each environment allowing users to have completely different plugins
 * for each of them. The constructor gets the resolved environment after the server
 * and builder has already been created simplifying config access and cache
 * management for for environment specific plugins.
 * Environment Plugins are closer to regular rollup plugins. They can't define
 * app level hooks (like config, configResolved, configureServer, etc).
 */
export interface Plugin<A = any> extends RollupPlugin<A> {
  /**
   * Perform custom handling of HMR updates.
   * The handler receives an options containing changed filename, timestamp, a
   * list of modules affected by the file change, and the dev server instance.
   *
   * - The hook can return a filtered list of modules to narrow down the update.
   *   e.g. for a Vue SFC, we can narrow down the part to update by comparing
   *   the descriptors.
   *
   * - The hook can also return an empty array and then perform custom updates
   *   by sending a custom hmr payload via environment.hot.send().
   *
   * - If the hook doesn't return a value, the hmr update will be performed as
   *   normal.
   */
  hotUpdate?: ObjectHook<
    (
      this: HotUpdatePluginContext,
      options: HotUpdateOptions,
    ) =>
      | Array<EnvironmentModuleNode>
      | void
      | Promise<Array<EnvironmentModuleNode> | void>
  >

  /**
   * extend hooks with ssr flag
   */
  resolveId?: ObjectHook<
    (
      this: ResolveIdPluginContext,
      source: string,
      importer: string | undefined,
      options: {
        attributes: Record<string, string>
        custom?: CustomPluginOptions
        ssr?: boolean
        /**
         * @internal
         */
        scan?: boolean
        isEntry: boolean
      },
    ) => Promise<ResolveIdResult> | ResolveIdResult
  >
  load?: ObjectHook<
    (
      this: PluginContext,
      id: string,
      options?: {
        ssr?: boolean
        /**
         * @internal
         */
        html?: boolean
      },
    ) => Promise<LoadResult> | LoadResult
  >
  transform?: ObjectHook<
    (
      this: TransformPluginContext,
      code: string,
      id: string,
      options?: {
        ssr?: boolean
      },
    ) => Promise<TransformResult> | TransformResult
  >
  /**
   * Opt-in this plugin into the shared plugins pipeline.
   * For backward-compatibility, plugins are re-recreated for each environment
   * during `vite build --app`
   * We have an opt-in per plugin, and a general `builder.sharedPlugins`
   * In a future major, we'll flip the default to be shared by default
   * @experimental
   */
  sharedDuringBuild?: boolean
  /**
   * Opt-in this plugin into per-environment buildStart and buildEnd during dev.
   * For backward-compatibility, the buildStart hook is called only once during
   * dev, for the client environment. Plugins can opt-in to be called
   * per-environment, aligning with the build hook behavior.
   * @experimental
   */
  perEnvironmentStartEndDuringDev?: boolean
  /**
   * Enforce plugin invocation tier similar to webpack loaders. Hooks ordering
   * is still subject to the `order` property in the hook object.
   *
   * Plugin invocation order:
   * - alias resolution
   * - `enforce: 'pre'` plugins
   * - vite core plugins
   * - normal plugins
   * - vite build plugins
   * - `enforce: 'post'` plugins
   * - vite build post plugins
   */
  enforce?: 'pre' | 'post'
  /**
   * Apply the plugin only for serve or build, or on certain conditions.
   */
  apply?:
    | 'serve'
    | 'build'
    | ((this: void, config: UserConfig, env: ConfigEnv) => boolean)
  /**
   * Define environments where this plugin should be active
   * By default, the plugin is active in all environments
   * @experimental
   */
  applyToEnvironment?: (
    environment: PartialEnvironment,
  ) => boolean | Promise<boolean> | PluginOption
  /**
   * Modify vite config before it's resolved. The hook can either mutate the
   * passed-in config directly, or return a partial config object that will be
   * deeply merged into existing config.
   *
   * Note: User plugins are resolved before running this hook so injecting other
   * plugins inside  the `config` hook will have no effect.
   */
  config?: ObjectHook<
    (
      this: void,
      config: UserConfig,
      env: ConfigEnv,
    ) =>
      | Omit<UserConfig, 'plugins'>
      | null
      | void
      | Promise<Omit<UserConfig, 'plugins'> | null | void>
  >
  /**
   * Modify environment configs before it's resolved. The hook can either mutate the
   * passed-in environment config directly, or return a partial config object that will be
   * deeply merged into existing config.
   * This hook is called for each environment with a partially resolved environment config
   * that already accounts for the default environment config values set at the root level.
   * If plugins need to modify the config of a given environment, they should do it in this
   * hook instead of the config hook. Leaving the config hook only for modifying the root
   * default environment config.
   */
  configEnvironment?: ObjectHook<
    (
      this: void,
      name: string,
      config: EnvironmentOptions,
      env: ConfigEnv,
    ) =>
      | EnvironmentOptions
      | null
      | void
      | Promise<EnvironmentOptions | null | void>
  >
  /**
   * Use this hook to read and store the final resolved vite config.
   */
  configResolved?: ObjectHook<
    (this: void, config: ResolvedConfig) => void | Promise<void>
  >
  /**
   * Configure the vite server. The hook receives the {@link ViteDevServer}
   * instance. This can also be used to store a reference to the server
   * for use in other hooks.
   *
   * The hooks will be called before internal middlewares are applied. A hook
   * can return a post hook that will be called after internal middlewares
   * are applied. Hook can be async functions and will be called in series.
   */
  configureServer?: ObjectHook<ServerHook>
  /**
   * Configure the preview server. The hook receives the {@link PreviewServer}
   * instance. This can also be used to store a reference to the server
   * for use in other hooks.
   *
   * The hooks are called before other middlewares are applied. A hook can
   * return a post hook that will be called after other middlewares are
   * applied. Hooks can be async functions and will be called in series.
   */
  configurePreviewServer?: ObjectHook<PreviewServerHook>
  /**
   * Transform index.html.
   * The hook receives the following arguments:
   *
   * - html: string
   * - ctx?: vite.ServerContext (only present during serve)
   * - bundle?: rollup.OutputBundle (only present during build)
   *
   * It can either return a transformed string, or a list of html tag
   * descriptors that will be injected into the `<head>` or `<body>`.
   *
   * By default the transform is applied **after** vite's internal html
   * transform. If you need to apply the transform before vite, use an object:
   * `{ order: 'pre', handler: hook }`
   */
  transformIndexHtml?: IndexHtmlTransform

  /**
   * Perform custom handling of HMR updates.
   * The handler receives a context containing changed filename, timestamp, a
   * list of modules affected by the file change, and the dev server instance.
   *
   * - The hook can return a filtered list of modules to narrow down the update.
   *   e.g. for a Vue SFC, we can narrow down the part to update by comparing
   *   the descriptors.
   *
   * - The hook can also return an empty array and then perform custom updates
   *   by sending a custom hmr payload via server.ws.send().
   *
   * - If the hook doesn't return a value, the hmr update will be performed as
   *   normal.
   */
  handleHotUpdate?: ObjectHook<
    (
      this: void,
      ctx: HmrContext,
    ) => Array<ModuleNode> | void | Promise<Array<ModuleNode> | void>
  >
}

export type HookHandler<T> = T extends ObjectHook<infer H> ? H : T

export type PluginWithRequiredHook<K extends keyof Plugin> = Plugin & {
  [P in K]: NonNullable<Plugin[P]>
}

type Thenable<T> = T | Promise<T>

type FalsyPlugin = false | null | undefined

export type PluginOption = Thenable<Plugin | FalsyPlugin | PluginOption[]>

export async function resolveEnvironmentPlugins(
  environment: PartialEnvironment,
): Promise<Plugin[]> {
  const environmentPlugins: Plugin[] = []
  for (const plugin of environment.getTopLevelConfig().plugins) {
    if (plugin.applyToEnvironment) {
      const applied = await plugin.applyToEnvironment(environment)
      if (!applied) {
        continue
      }
      if (applied !== true) {
        environmentPlugins.push(
          ...((await asyncFlatten(arraify(applied))).filter(
            Boolean,
          ) as Plugin[]),
        )
        continue
      }
    }
    environmentPlugins.push(plugin)
  }
  return environmentPlugins
}

/**
 * @experimental
 */
export function perEnvironmentPlugin(
  name: string,
  applyToEnvironment: (
    environment: PartialEnvironment,
  ) => boolean | Promise<boolean> | PluginOption,
): Plugin {
  return {
    name,
    applyToEnvironment,
  }
}
