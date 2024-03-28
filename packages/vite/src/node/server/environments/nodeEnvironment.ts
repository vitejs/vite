import type { DevEnvironmentSetup } from '../environment'
import { DevEnvironment } from '../environment'
import type { ViteDevServer } from '../index'
import { asyncFunctionDeclarationPaddingLineCount } from '../../../shared/utils'

export function createNodeDevEnvironment(
  server: ViteDevServer,
  name: string,
  options?: DevEnvironmentSetup,
): DevEnvironment {
  return new DevEnvironment(server, name, {
    ...options,
    runner: {
      processSourceMap(map) {
        // this assumes that "new AsyncFunction" is used to create the module
        return Object.assign({}, map, {
          mappings:
            ';'.repeat(asyncFunctionDeclarationPaddingLineCount) + map.mappings,
        })
      },
      ...options?.runner,
    },
  })
}
