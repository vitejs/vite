import type { ResolvedConfig } from '../../config'
import type { DevEnvironmentContext } from '../environment'
import { DevEnvironment } from '../environment'
import { createServerHotChannel } from '../hmr'

export function createNodeDevEnvironment(
  name: string,
  config: ResolvedConfig,
  context: DevEnvironmentContext,
): DevEnvironment {
  if (context.hot == null) {
    context.hot = createServerHotChannel()
  }

  return new DevEnvironment(name, config, context)
}
