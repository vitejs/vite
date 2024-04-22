import type { CustomPayload, HMRPayload } from 'types/hmrPayload'
import type { ModuleRunnerHMRConnection } from 'vite/module-runner'
import type { HMRBroadcasterClient, ServerHMRChannel } from '../../server/hmr'

class ServerHMRBroadcasterClient implements HMRBroadcasterClient {
  constructor(private readonly hmrChannel: ServerHMRChannel) {}

  send(...args: any[]) {
    let payload: HMRPayload
    if (typeof args[0] === 'string') {
      payload = {
        type: 'custom',
        event: args[0],
        data: args[1],
      }
    } else {
      payload = args[0]
    }
    if (payload.type !== 'custom') {
      throw new Error(
        'Cannot send non-custom events from the client to the server.',
      )
    }
    this.hmrChannel.send(payload)
  }
}

/**
 * The connector class to establish HMR communication between the server and the Vite runtime.
 * @experimental
 */
export class ServerHMRConnector implements ModuleRunnerHMRConnection {
  private handlers: ((payload: HMRPayload) => void)[] = []
  private hmrClient: ServerHMRBroadcasterClient

  private connected = false

  constructor(private hmrChannel: ServerHMRChannel) {
    this.hmrClient = new ServerHMRBroadcasterClient(hmrChannel)
    hmrChannel.api.outsideEmitter.on('send', (payload: HMRPayload) => {
      this.handlers.forEach((listener) => listener(payload))
    })
    this.hmrChannel = hmrChannel
  }

  isReady(): boolean {
    return this.connected
  }

  send(message: string): void {
    const payload = JSON.parse(message) as CustomPayload
    this.hmrChannel.api.innerEmitter.emit(
      payload.event,
      payload.data,
      this.hmrClient,
    )
  }

  onUpdate(handler: (payload: HMRPayload) => void): void {
    this.handlers.push(handler)
    handler({ type: 'connected' })
    this.connected = true
  }
}
