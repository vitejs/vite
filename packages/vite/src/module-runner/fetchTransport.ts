import { ENVIRONMENT_URL_PUBLIC_PATH } from '../shared/constants'
import type { RunnerTransport } from './runnerTransport'
import type { FetchFunctionOptions, FetchResult } from './types'

export class FetchTransport implements RunnerTransport {
  constructor(
    private environmentName: string,
    private serverURL: string,
  ) {}

  async fetchModule(
    moduleUrl: string,
    importer: string | undefined,
    { cached, startOffset }: FetchFunctionOptions = {},
  ): Promise<FetchResult> {
    const serverUrl = new URL(
      `${ENVIRONMENT_URL_PUBLIC_PATH}/${this.environmentName}`,
      this.serverURL,
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
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    const response = await fetch(request)
    if (response.status !== 200) {
      // TODO: better error?
      throw new Error(
        `Failed to fetch module ${moduleUrl}, responded with ${response.status} (${response.statusText})`,
      )
    }
    return await response.json()
  }
}
