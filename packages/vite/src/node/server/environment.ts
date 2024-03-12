import { Environment } from '../environment'
import type { ViteDevServer } from '../server'
import { ERR_OUTDATED_OPTIMIZED_DEP } from '../plugins/optimizedDeps'
import { EnvironmentModuleGraph } from './moduleGraph'
import type { HMRChannel } from './hmr'
import { createNoopHMRChannel } from './hmr'
import { transformRequest } from './transformRequest'
import type { TransformResult } from './transformRequest'
import { ERR_CLOSED_SERVER } from './pluginContainer'

// Maybe we will rename this to DevEnvironment
export class ModuleExecutionEnvironment extends Environment {
  mode = 'dev' as const // TODO: should this be 'serve'?
  moduleGraph: EnvironmentModuleGraph
  get server(): ViteDevServer {
    return this._getServer()
  }
  /**
   * @internal
   */
  _getServer: () => ViteDevServer
  /**
   * HMR channel for this environment. If not provided or disabled,
   * it will be a noop channel that does nothing.
   *
   * @example
   * environment.hot.send({ type: 'full-reload' })
   */
  hot: HMRChannel
  constructor(
    server: ViteDevServer | (() => ViteDevServer),
    id: string,
    options: {
      type: string
      // TODO: use `transport` instead to support any hmr channel?
      hot?: false | HMRChannel
    },
  ) {
    super(id, options)
    this._getServer = typeof server === 'function' ? server : () => server
    this.moduleGraph = new EnvironmentModuleGraph(options.type, (url: string) =>
      this.server.pluginContainer.resolveId(url, undefined, {
        ssr: this.type !== 'browser',
        environment: this,
      }),
    )
    this.hot = options.hot || createNoopHMRChannel()
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
