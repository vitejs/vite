import type { PartialResolvedId } from 'rollup'
import { EnvironmentModuleGraph } from './moduleGraph'
import type { HMRChannel} from './hmr';
import { createNoopHMRChannel } from './hmr'

export class ModuleExecutionEnvironment {
  id: string
  type: string
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
      resolveId: (url: string) => Promise<PartialResolvedId | null>
      // TODO: use `transport` instead to support any hmr channel?
      hot?: false | HMRChannel
    },
  ) {
    this.id = id
    this.type = options.type
    this.moduleGraph = new EnvironmentModuleGraph(
      options.type,
      options.resolveId,
    )
    this.hot = options.hot || createNoopHMRChannel()
  }
}
