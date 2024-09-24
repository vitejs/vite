import type { ResolvedConfig } from '../../config'
import type { DevEnvironmentContext } from '../environment'
import { DevEnvironment } from '../environment'

export function createNodeDevEnvironment(
  name: string,
  config: ResolvedConfig,
  context: DevEnvironmentContext,
): DevEnvironment {
  if (context.hot == null) {
    throw new Error(
      '`hot` is a required option. Either explicitly opt out of HMR by setting `hot: false` or provide a hot channel.',
    )
  }

  return new DevEnvironment(name, config, context)
}
