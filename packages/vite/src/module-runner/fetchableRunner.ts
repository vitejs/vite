import { ESModulesEvaluator } from './esmEvaluator'
import { FetchTransport } from './fetchTransport'
import { ModuleRunner } from './runner'
import type { ModuleRunnerOptions } from './types'

export interface FetchableModuleRunnerOptions
  extends Pick<
    ModuleRunnerOptions,
    'sourcemapInterceptor' | 'evaluatedModules' | 'hmr'
  > {
  root: string
  serverURL: string
  environmentName: string
}

export function createFetchableModuleRunner(
  options: FetchableModuleRunnerOptions,
): ModuleRunner {
  const { serverURL, environmentName } = options
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  const fetch = globalThis.fetch
  if (!fetch) {
    throw new TypeError('fetch is not available in this environment')
  }
  return new ModuleRunner(
    {
      root: options.root,
      transport: new FetchTransport(environmentName, serverURL),
      hmr: options.hmr,
    },
    new ESModulesEvaluator(),
  )
}
