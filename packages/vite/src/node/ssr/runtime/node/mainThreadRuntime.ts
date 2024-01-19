import type { ViteDevServer } from '../../../index'
import { ViteRuntime } from '../runtime'
import { ESModulesRunner } from '../esmRunner'
import { createHMRHandler } from '../hmrHandler'
import type { ViteModuleRunner, ViteServerClientOptions } from '../types'
import type { HMRLogger } from '../../../../shared/hmr'
import { ServerHMRConnector } from './serverHmrConnector'

interface MainThreadRuntimeOptions
  extends Omit<ViteServerClientOptions, 'root' | 'fetchModule' | 'hmr'> {
  hmr?:
    | false
    | {
        logger?: false | HMRLogger
      }
  runner?: ViteModuleRunner
}

function createHMROptions(
  server: ViteDevServer,
  options: MainThreadRuntimeOptions,
) {
  if (server.config.server.hmr === false || options.hmr === false) {
    return false
  }
  const connection = new ServerHMRConnector(server)
  return {
    connection,
    logger: options.hmr?.logger,
  }
}

export async function createViteRuntime(
  server: ViteDevServer,
  options: MainThreadRuntimeOptions = {},
): Promise<ViteRuntime> {
  const hmr = createHMROptions(server, options)
  const runtime = new ViteRuntime(
    {
      ...options,
      root: server.config.root,
      fetchModule: server.ssrFetchModule,
      hmr,
    },
    options.runner || new ESModulesRunner(),
  )

  if (hmr) {
    hmr.connection.onUpdate(createHMRHandler(runtime))
  }

  return runtime
}
