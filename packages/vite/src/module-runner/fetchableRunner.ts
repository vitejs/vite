import { ENVIRONMENT_URL_PUBLIC_PATH } from '../shared/constants'
import { ESModulesEvaluator } from './esmEvaluator'
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
      transport: {
        async fetchModule(moduleUrl, importer, { cached, startOffset } = {}) {
          const serverUrl = new URL(
            `${ENVIRONMENT_URL_PUBLIC_PATH}/${environmentName}`,
            serverURL,
          )
          serverUrl.searchParams.set('moduleUrl', encodeURIComponent(moduleUrl))
          if (importer) {
            serverUrl.searchParams.set('importer', encodeURIComponent(importer))
          }
          // eslint-disable-next-line n/no-unsupported-features/node-builtins
          const request = new Request(serverUrl, {
            headers: {
              'x-vite-cache': String(cached ?? false),
              'x-vite-start-offset': String(startOffset ?? ''),
            },
          })
          const response = await fetch(request)
          if (response.status !== 200) {
            // TODO: better error?
            throw new Error(
              `Failed to fetch module ${moduleUrl}, responded with ${response.status} (${response.statusText})`,
            )
          }
          return await response.json()
        },
      },
      hmr: options.hmr,
    },
    new ESModulesEvaluator(),
  )
}
