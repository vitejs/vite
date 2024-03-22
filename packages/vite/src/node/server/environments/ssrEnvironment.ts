import { DevEnvironment } from '../environment'
import type { ServerHMRChannel } from '../hmr'
import type { ViteDevServer } from '../index'
import { asyncFunctionDeclarationPaddingLineCount } from '../../../shared/utils'

export function createSsrEnvironment(
  server: ViteDevServer,
  name: string,
  hotChannel: ServerHMRChannel,
): DevEnvironment {
  return new DevEnvironment(server, name, {
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
}
