import { Environment } from '../environment'
import type { ViteDevServer } from '../server'
import { ERR_OUTDATED_OPTIMIZED_DEP } from '../plugins/optimizedDeps'
import type { DevEnvironmentConfig } from '../config'
import { mergeConfig } from '../utils'
import { EnvironmentModuleGraph } from './moduleGraph'
import type { HMRChannel } from './hmr'
import { createNoopHMRChannel } from './hmr'
import { transformRequest } from './transformRequest'
import type { TransformResult } from './transformRequest'
import { ERR_CLOSED_SERVER } from './pluginContainer'

// Maybe we will rename this to DevEnvironment
export class DevEnvironment extends Environment {
  mode = 'dev' as const // TODO: should this be 'serve'?
  moduleGraph: EnvironmentModuleGraph
  server: ViteDevServer
  get config(): DevEnvironmentConfig {
    if (!this._config) {
      // Merge the resolved configs, TODO: make generic on DevEnvironmentConfig
      const { resolve, optimizeDeps, dev } = this.server.config
      let resolvedConfig: DevEnvironmentConfig = { resolve, optimizeDeps, dev }
      const environmentConfig = this.server.config.environments?.find(
        (e) => e.name === this.name,
      )
      if (environmentConfig) {
        resolvedConfig = mergeConfig(resolvedConfig, environmentConfig)
      }
      if (this._inlineConfig) {
        resolvedConfig = mergeConfig(resolvedConfig, this._inlineConfig)
      }
      this._config = resolvedConfig
    }
    return this._config
  }
  /**
   * @internal
   */
  _config: DevEnvironmentConfig | undefined
  /**
   * @internal
   */
  _inlineConfig: DevEnvironmentConfig | undefined
  /**
   * HMR channel for this environment. If not provided or disabled,
   * it will be a noop channel that does nothing.
   *
   * @example
   * environment.hot.send({ type: 'full-reload' })
   */
  hot: HMRChannel
  constructor(
    server: ViteDevServer,
    name: string,
    options?: {
      // TODO: use `transport` instead to support any hmr channel?
      hot?: false | HMRChannel
      config?: DevEnvironmentConfig
    },
  ) {
    super(name)
    this.server = server
    this.moduleGraph = new EnvironmentModuleGraph(name, (url: string) =>
      this.server.pluginContainer.resolveId(url, undefined, {
        environment: this,
      }),
    )
    this.hot = options?.hot || createNoopHMRChannel()
    this._inlineConfig = options?.config
  }

  transformRequest(url: string): Promise<TransformResult | null> {
    return transformRequest(url, this.server, undefined, this)
  }

  async warmupRequest(url: string): Promise<void> {
    await transformRequest(url, this.server, undefined, this).catch((e) => {
      if (
        e?.code === ERR_OUTDATED_OPTIMIZED_DEP ||
        e?.code === ERR_CLOSED_SERVER
      ) {
        // these are expected errors
        return
      }
      // Unexpected error, log the issue but avoid an unhandled exception
      this.server.config.logger.error(`Pre-transform error: ${e.message}`, {
        error: e,
        timestamp: true,
      })
    })
  }
}
