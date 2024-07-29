import type { ResolvedConfig } from '../../config'
import type { DevEnvironmentSetup } from '../environment'
import { DevEnvironment } from '../environment'
import { createServerHotChannel } from '../hmr'
import { asyncFunctionDeclarationPaddingLineCount } from '../../../shared/utils'

export function createNodeSsrDevEnvironment(
  name: string,
  config: ResolvedConfig,
  setup?: DevEnvironmentSetup,
): DevEnvironment {
  return createNodeDevEnvironment(name, config, {
    ...setup,
    hot: createServerHotChannel(),
  })
}

export function createNodeDevEnvironment(
  name: string,
  config: ResolvedConfig,
  setup?: DevEnvironmentSetup,
): DevEnvironment {
  return new DevEnvironment(name, config, {
    ...setup,
    runner: {
      processSourceMap(map) {
        // this assumes that "new AsyncFunction" is used to create the module
        return Object.assign({}, map, {
          mappings:
            ';'.repeat(asyncFunctionDeclarationPaddingLineCount) + map.mappings,
        })
      },
      ...setup?.runner,
    },
  })
}
