import { existsSync, readFileSync } from 'node:fs'
import { ESModulesRunner, ViteRuntime } from 'vite/runtime'
import type { ViteModuleRunner, ViteRuntimeOptions } from 'vite/runtime'
import type { ViteDevServer } from '../../server'
import type { HMRLogger } from '../../../shared/hmr'
import { ServerHMRConnector } from './serverHmrConnector'

/**
 * @experimental
 */
export interface MainThreadRuntimeOptions
  extends Omit<ViteRuntimeOptions, 'root' | 'fetchModule' | 'hmr'> {
  /**
   * Disable HMR or configure HMR logger.
   */
  hmr?:
    | false
    | {
        logger?: false | HMRLogger
      }
  /**
   * Provide a custom module runner. This controls how the code is executed.
   */
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

const prepareStackTrace = {
  retrieveFile(id: string) {
    if (existsSync(id)) {
      return readFileSync(id, 'utf-8')
    }
  },
}

function resolveSourceMapOptions(options: MainThreadRuntimeOptions) {
  if (options.sourcemapInterceptor != null) {
    if (options.sourcemapInterceptor === 'prepareStackTrace') {
      return prepareStackTrace
    }
    if (typeof options.sourcemapInterceptor === 'object') {
      return { ...prepareStackTrace, ...options.sourcemapInterceptor }
    }
    return options.sourcemapInterceptor
  }
  if (typeof process !== 'undefined' && 'setSourceMapsEnabled' in process) {
    return 'node'
  }
  return prepareStackTrace
}

/**
 * Create an instance of the Vite SSR runtime that support HMR.
 * @experimental
 */
export async function createViteRuntime(
  server: ViteDevServer,
  options: MainThreadRuntimeOptions = {},
): Promise<ViteRuntime> {
  const hmr = createHMROptions(server, options)
  return new ViteRuntime(
    {
      ...options,
      root: server.config.root,
      fetchModule: server.ssrFetchModule,
      hmr,
      sourcemapInterceptor: resolveSourceMapOptions(options),
    },
    options.runner || new ESModulesRunner(),
  )
}
