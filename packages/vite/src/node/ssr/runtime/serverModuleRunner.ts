import { existsSync, readFileSync } from 'node:fs'
import { ESModulesEvaluator, ModuleRunner } from 'vite/module-runner'
import type { ModuleEvaluator, ModuleRunnerOptions } from 'vite/module-runner'
import type { ViteDevServer } from '../../server'
import type { HMRLogger } from '../../../shared/hmr'
import type { DevEnvironment } from '../../server/environment'
import { ServerHMRConnector } from './serverHmrConnector'

/**
 * @experimental
 */
export interface ServerModuleRunnerOptions
  extends Omit<
    ModuleRunnerOptions,
    'root' | 'fetchModule' | 'hmr' | 'transport'
  > {
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
  runner?: ModuleEvaluator
}

function createHMROptions(
  server: ViteDevServer,
  options: ServerModuleRunnerOptions,
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

function resolveSourceMapOptions(options: ServerModuleRunnerOptions) {
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
export function createServerModuleRunner(
  environment: DevEnvironment,
  options: ServerModuleRunnerOptions = {},
): ModuleRunner {
  const hmr = createHMROptions(environment.server, options)
  return new ModuleRunner(
    {
      ...options,
      root: environment.server.config.root,
      transport: {
        fetchModule: (id, importer) => environment.fetchModule(id, importer),
      },
      hmr,
      sourcemapInterceptor: resolveSourceMapOptions(options),
    },
    options.runner || new ESModulesEvaluator(),
  )
}
