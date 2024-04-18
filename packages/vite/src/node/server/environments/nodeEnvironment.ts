import type { ModuleRunner } from 'vite/module-runner'
import type { DevEnvironmentSetup } from '../environment'
import { DevEnvironment } from '../environment'
import type { ViteDevServer } from '../index'
import { asyncFunctionDeclarationPaddingLineCount } from '../../../shared/utils'
import { createServerModuleRunner } from '../../ssr/runtime/serverModuleRunner'

export function createNodeDevEnvironment(
  server: ViteDevServer,
  name: string,
  options?: DevEnvironmentSetup,
): DevEnvironment {
  return new NodeDevEnvironment(server, name, {
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

class NodeDevEnvironment extends DevEnvironment {
  private runner: ModuleRunner | undefined

  override async evaluate(url: string): Promise<void> {
    if (this._ssrRunnerOptions?.transport) return super.evaluate(url)
    const runner = this.runner || (this.runner = createServerModuleRunner(this))
    await runner.import(url)
  }
}
