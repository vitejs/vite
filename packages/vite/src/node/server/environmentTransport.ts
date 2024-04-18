import type {
  TransportMethods,
  TransportOptions,
} from '../../shared/remoteTransport'
import { RemoteTransport } from '../../shared/remoteTransport'
import type { DevEnvironment } from './environment'

interface RemoteEnvironmentTransportOptions<M extends TransportMethods = any>
  extends Omit<TransportOptions<M>, 'methods'> {
  methods?: M
}

export class RemoteEnvironmentTransport<
  M extends TransportMethods = {},
  E extends TransportMethods = {},
> extends RemoteTransport<M, E> {
  private _environment: DevEnvironment | undefined

  constructor(options: RemoteEnvironmentTransportOptions<M>) {
    super({
      ...options,
      methods: {
        ...(options.methods as M),
        fetchModule: (url: string) => {
          if (!this._environment) {
            throw new Error('[vite-transport] Environment is not registered')
          }
          return this._environment.fetchModule(url)
        },
      },
    })
  }

  async evaluate(url: string): Promise<void> {
    // evaluate is a special method that we don't expoe in types
    await (this.invoke as any)('evaluate', url)
  }

  register(environment: DevEnvironment): void {
    this._environment = environment
  }
}
