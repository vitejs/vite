import type {
  RemoteRunnerTransportEvents,
  RemoteRunnerTransportMethods,
} from 'vite/module-runner'
import type {
  TransportMethods,
  TransportOptions} from '../../shared/remoteTransport';
import {
  RemoteTransport
} from '../../shared/remoteTransport'
import type { DevEnvironment } from './environment'

interface RemoteEnvironmentTransportOptions<M extends TransportMethods = any>
  extends Omit<TransportOptions<M>, 'methods'> {
  methods?: M
}

export class RemoteEnvironmentTransport<
  M extends TransportMethods = {},
  E extends TransportMethods = {},
> extends RemoteTransport<
  M & RemoteRunnerTransportEvents,
  E & RemoteRunnerTransportMethods
> {
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
    // TODO: url gives a type error for some reason here, but works when
    // the class is contructed from the outside
    await (this.dispatch as any)('evaluate', url)
  }

  register(environment: DevEnvironment): void {
    this._environment = environment
  }
}
