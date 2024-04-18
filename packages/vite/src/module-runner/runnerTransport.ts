import type {
  TransportMethods,
  TransportOptions,
} from '../shared/remoteTransport'
import { RemoteTransport } from '../shared/remoteTransport'
import type { FetchFunction, FetchResult } from './types'
import type { ModuleRunner } from './runner'

export interface RunnerTransport {
  fetchModule: FetchFunction
}

interface RemoteRunnerTransportOptions<M extends TransportMethods = any>
  extends Omit<TransportOptions<M>, 'methods'> {
  methods?: M
}

export class RemoteRunnerTransport<
    M extends TransportMethods = {},
    E extends TransportMethods = {},
  >
  extends RemoteTransport<M, E>
  implements RunnerTransport
{
  private _runner: ModuleRunner | undefined

  constructor(options: RemoteRunnerTransportOptions<M>) {
    super({
      ...options,
      methods: {
        ...(options.methods as M),
        evaluate: async (url: string) => {
          if (!this._runner) {
            throw new Error('[vite-transport] Runner is not registered')
          }
          await this._runner.import(url)
        },
      },
    })
  }

  async fetchModule(id: string, importer?: string): Promise<FetchResult> {
    // fetchModule is a special method that we don't expoe in types
    return await (this.invoke as any)('fetchModule', id, importer)
  }

  register(runner: ModuleRunner): void {
    this._runner = runner
  }
}
