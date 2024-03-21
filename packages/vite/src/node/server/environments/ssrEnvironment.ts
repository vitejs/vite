import { DevEnvironment } from '../environment'
import type { ServerHMRChannel } from '../hmr'
import type { ViteDevServer } from '../index'
import { asyncFunctionDeclarationPaddingLineCount } from '../../../shared/utils'

export function createSsrEnvironment(
  hotChannel: ServerHMRChannel,
  server: ViteDevServer,
  name: string,
): DevEnvironment {
  const environment = new DevEnvironment(server, name, {
    hot: hotChannel,
    runner: {
      processSourceMap(map) {
        // this assumes that "new AsyncFunction" is used to create the module
        return Object.assign({}, map, {
          mappings:
            ';'.repeat(asyncFunctionDeclarationPaddingLineCount) + map.mappings,
        })
      },
    },
  })
  return environment
}
