import type { CustomPayload, HotPayload } from 'types/hmrPayload'
import type { ModuleRunnerHMRConnection } from 'vite/module-runner'
import type { HotChannelClient, ServerHotChannel } from '../../server/hmr'

class ServerHMRBroadcasterClient implements HotChannelClient {
  constructor(private readonly hotChannel: ServerHotChannel) {}

  send(...args: any[]) {
    let payload: HotPayload
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
    this.hotChannel.send(payload)
  }
}

/**
 * The connector class to establish HMR communication between the server and the Vite runtime.
 * @experimental
 */
export class ServerHMRConnector implements ModuleRunnerHMRConnection {
  private handlers: ((payload: HotPayload) => void)[] = []
  private hmrClient: ServerHMRBroadcasterClient

  private connected = false

  constructor(private hotChannel: ServerHotChannel) {
    this.hmrClient = new ServerHMRBroadcasterClient(hotChannel)
    hotChannel.api.outsideEmitter.on('send', (payload: HotPayload) => {
      this.handlers.forEach((listener) => listener(payload))
    })
    this.hotChannel = hotChannel
  }

  isReady(): boolean {
    return this.connected
  }

  send(payload_: HotPayload): void {
    const payload = payload_ as CustomPayload
    this.hotChannel.api.innerEmitter.emit(
      payload.event,
      payload.data,
      this.hmrClient,
    )
  }

  onUpdate(handler: (payload: HotPayload) => void): void {
    this.handlers.push(handler)
    handler({ type: 'connected' })
    this.connected = true
  }
}
