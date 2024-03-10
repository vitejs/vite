import type { PartialResolvedId } from 'rollup'
import { EnvironmentModuleGraph } from './moduleGraph'

export class ModuleExecutionEnvironment {
  id: string
  type: string
  moduleGraph: EnvironmentModuleGraph
  constructor(
    id: string,
    options: {
      type: string
      resolveId: (url: string) => Promise<PartialResolvedId | null>
    },
  ) {
    this.id = id
    this.type = options.type
    this.moduleGraph = new EnvironmentModuleGraph(
      options.type,
      options.resolveId,
    )
  }
}
