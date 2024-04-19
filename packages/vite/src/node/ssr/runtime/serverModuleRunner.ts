import { existsSync, readFileSync } from 'node:fs'
import { ESModulesEvaluator, ModuleRunner } from 'vite/module-runner'
import type {
  ModuleEvaluator,
  ModuleRunnerHMRConnection,
  ModuleRunnerHmr,
  ModuleRunnerOptions,
} from 'vite/module-runner'
import type { ViteDevServer } from '../../server'
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
        connection?: ModuleRunnerHMRConnection
        logger?: ModuleRunnerHmr['logger']
      }
  /**
   * Provide a custom module evaluator. This controls how the code is executed.
   */
  evaluator?: ModuleEvaluator
}

function createHMROptions(
  server: ViteDevServer,
  options: ServerModuleRunnerOptions,
) {
  if (server.config.server.hmr === false || options.hmr === false) {
    return false
  }
  if (options.hmr?.connection) {
    return {
      connection: options.hmr.connection,
      logger: options.hmr.logger,
    }
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
  server: ViteDevServer,
  environment: DevEnvironment,
  options: ServerModuleRunnerOptions = {},
): ModuleRunner {
  const hmr = createHMROptions(server, options)
  return new ModuleRunner(
    {
      ...options,
      root: environment.config.root,
      transport: {
        fetchModule: (id, importer) => environment.fetchModule(id, importer),
      },
      hmr,
      sourcemapInterceptor: resolveSourceMapOptions(options),
    },
    options.evaluator || new ESModulesEvaluator(),
  )
}
