import type { PartialResolvedId } from 'rollup'
import { Environment } from '../environment'
import { EnvironmentModuleGraph } from './moduleGraph'
import type { HMRChannel } from './hmr'
import { createNoopHMRChannel } from './hmr'

// Maybe we will rename this to DevEnvironment
export class ModuleExecutionEnvironment extends Environment {
  command = 'serve' as const
  moduleGraph: EnvironmentModuleGraph
  /**
   * HMR channel for this environment. If not provided or disabled,
   * it will be a noop channel that does nothing.
   *
   * @example
   * environment.hot.send({ type: 'full-reload' })
   */
  hot: HMRChannel
  constructor(
    id: string,
    options: {
      type: string
      resolveId: (
        url: string,
        environment: ModuleExecutionEnvironment,
      ) => Promise<PartialResolvedId | null>
      // TODO: use `transport` instead to support any hmr channel?
      hot?: false | HMRChannel
    },
  ) {
    super(id, options)
    this.moduleGraph = new EnvironmentModuleGraph(options.type, (url: string) =>
      options.resolveId(url, this),
    )
    this.hot = options.hot || createNoopHMRChannel()
  }
}
