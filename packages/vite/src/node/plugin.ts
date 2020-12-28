import { UserConfig } from './config'
import { Plugin as RollupPlugin } from 'rollup'
import { ServerHook, ViteDevServer } from './server'
import { IndexHtmlTransform } from './plugins/html'
import { ModuleNode } from './server/moduleGraph'
import { ResolvedConfig } from './'

/**
 * Vite plugins support a subset of Rollup plugin API with a few extra
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
 * When running on the dev server, the plugin also has access to `this.server`
 * via the plugin context, which is the {@link ViteDevServer} instance.
 *
 * A plugin that expects to have different behavior depending on serve/build can
 * export a factory function that receives the command being run via options.
 *
 * If a plugin should be applied only for server or build, a function format
 * config file can be used to conditional determine the plugins to use.
 */
export interface Plugin extends RollupPlugin {
  /**
   * Enforce plugin invocation tier similar to webpack loaders.
   *
   * Plugin invocation order:
   * - alias resolution
   * - `enforce: 'pre'` plugins
   * - vite internal plugins
   * - normal plugins
   * - `enforce: 'post'` plugins
   */
  enforce?: 'pre' | 'post'
  /**
   * Mutate or return new vite config before it's resolved.
   * Note user plugins are resolved before this hook so adding plugins inside
   * a plugin's modifyConfig hook will have no effect.
   */
  config?: (config: UserConfig) => UserConfig | null | void
  /**
   * Use this hook to read and store the final resolved vite config.
   */
  configResolved?: (config: ResolvedConfig) => void
  /**
   * Configure the vite server. The hook receives the {@link ViteDevServer}
   * instance. This can also be used to store a reference to the server
   * for use in other hooks.
   *
   * The hooks will be called before internal middlewares are applied. A hook
   * can return a post hook that will be called after internal middlewares
   * are applied. Hook can be async functions and will be called in series.
   */
  configureServer?: ServerHook
  /**
   * Transform index.html.
   * The hook receives the following arguments:
   *
   * - html: string
   * - ctx?: vite.ServerContext (only present during serve)
   * - bundle?: rollup.OutputBundle (only present during build)
   *
   * It can either return a transformed string, or a list of html tag
   * descriptors that will be injected into the <head> or <body>.
   *
   * By default the transform is applied **after** vite's internal html
   * transform. If you need to apply the transform before vite, use an object:
   * `{ enforce: 'pre', transform: hook }`
   */
  transformIndexHtml?: IndexHtmlTransform
  /**
   * Perform custom handling of HMR updates.
   * The handler receives the changed filename, a list of modules affected by
   * the file change, and the dev server instance.
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
  handleHotUpdate?: (
    file: string,
    mods: Array<ModuleNode>,
    server: ViteDevServer
  ) => Array<ModuleNode> | void | Promise<Array<ModuleNode> | void>
}
