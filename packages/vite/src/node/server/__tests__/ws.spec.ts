import { beforeEach, describe, expect, it } from 'vitest'
import type { ErrorPayload, FullReloadPayload } from '#types/hmrPayload'

/**
 * Mock WebSocket client for testing
 */
class MockWebSocket {
  readyState: number = 1 // 1 = OPEN
  messages: string[] = []

  send(data: string) {
    this.messages.push(data)
  }

  close() {
    this.readyState = 3 // CLOSED
  }
}

/**
 * Creates a minimal mock WebSocket server for testing buffering logic
 */
function createMockWsServer() {
  const clients = new Set<MockWebSocket>()
  let bufferedMessages: (ErrorPayload | FullReloadPayload)[] = []

  const connectionHandlers: ((socket: MockWebSocket) => void)[] = []

  return {
    clients,
    bufferedMessages,

    // Simulate the send logic from ws.ts
    send(payload: ErrorPayload | FullReloadPayload | { type: string }) {
      if (payload.type === 'error' || payload.type === 'full-reload') {
        // full-reload invalidates previous errors and redundant full-reloads
        if (payload.type === 'full-reload') {
          bufferedMessages = []
        }

        if (!clients.size) {
          bufferedMessages.push(payload as ErrorPayload | FullReloadPayload)
          return
        }

        const stringified = JSON.stringify(payload)
        let sent = false
        clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(stringified)
            sent = true
          }
        })

        // Buffer if no client received the message
        if (!sent) {
          bufferedMessages.push(payload as ErrorPayload | FullReloadPayload)
        }
        return
      }

      const stringified = JSON.stringify(payload)
      clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(stringified)
        }
      })
    },

    // Simulate connection event
    onConnection(handler: (socket: MockWebSocket) => void) {
      connectionHandlers.push(handler)
    },

    // Simulate a new client connecting
    simulateConnection(): MockWebSocket {
      const socket = new MockWebSocket()
      clients.add(socket)

      // Send connected message
      socket.send(JSON.stringify({ type: 'connected' }))

      // Send buffered messages (copy and clear immediately)
      if (bufferedMessages.length > 0) {
        const messagesToSend = bufferedMessages.slice()
        bufferedMessages = []
        for (const msg of messagesToSend) {
          socket.send(JSON.stringify(msg))
        }
      }

      connectionHandlers.forEach((handler) => handler(socket))
      return socket
    },

    // Simulate client disconnection
    simulateDisconnection(socket: MockWebSocket) {
      socket.readyState = 3 // CLOSED
      clients.delete(socket)
    },

    getBufferedMessages() {
      return bufferedMessages
    },
  }
}

describe('WebSocket message buffering', () => {
  let server: ReturnType<typeof createMockWsServer>

  beforeEach(() => {
    server = createMockWsServer()
  })

  describe('buffering when no clients connected', () => {
    it('should buffer error message when no clients', () => {
      const errorPayload: ErrorPayload = {
        type: 'error',
        err: {
          message: 'Test error',
          stack: 'Error stack',
        },
      }

      server.send(errorPayload)

      expect(server.getBufferedMessages()).toHaveLength(1)
      expect(server.getBufferedMessages()[0]).toEqual(errorPayload)
    })

    it('should buffer full-reload message when no clients', () => {
      const reloadPayload: FullReloadPayload = {
        type: 'full-reload',
        path: '*',
      }

      server.send(reloadPayload)

      expect(server.getBufferedMessages()).toHaveLength(1)
      expect(server.getBufferedMessages()[0]).toEqual(reloadPayload)
    })

    it('should buffer multiple error messages', () => {
      const error1: ErrorPayload = {
        type: 'error',
        err: { message: 'Error 1', stack: '' },
      }
      const error2: ErrorPayload = {
        type: 'error',
        err: { message: 'Error 2', stack: '' },
      }

      server.send(error1)
      server.send(error2)

      expect(server.getBufferedMessages()).toHaveLength(2)
      expect(server.getBufferedMessages()[0]).toEqual(error1)
      expect(server.getBufferedMessages()[1]).toEqual(error2)
    })

    it('should clear buffer when full-reload arrives', () => {
      const error1: ErrorPayload = {
        type: 'error',
        err: { message: 'Error 1', stack: '' },
      }
      const error2: ErrorPayload = {
        type: 'error',
        err: { message: 'Error 2', stack: '' },
      }
      const reload: FullReloadPayload = {
        type: 'full-reload',
        path: '*',
      }

      server.send(error1)
      server.send(error2)
      server.send(reload)

      // Buffer should only contain the full-reload
      expect(server.getBufferedMessages()).toHaveLength(1)
      expect(server.getBufferedMessages()[0]).toEqual(reload)
    })

    it('should not accumulate multiple full-reloads', () => {
      const reload1: FullReloadPayload = {
        type: 'full-reload',
        path: '/a.js',
      }
      const reload2: FullReloadPayload = {
        type: 'full-reload',
        path: '/b.js',
      }

      server.send(reload1)
      server.send(reload2)

      // Only the last full-reload should be buffered
      expect(server.getBufferedMessages()).toHaveLength(1)
      expect(server.getBufferedMessages()[0]).toEqual(reload2)
    })
  })

  describe('sending buffered messages on connection', () => {
    it('should send buffered messages to newly connected client', () => {
      const errorPayload: ErrorPayload = {
        type: 'error',
        err: { message: 'Buffered error', stack: '' },
      }

      // Buffer message before client connects
      server.send(errorPayload)
      expect(server.getBufferedMessages()).toHaveLength(1)

      // Connect client
      const client = server.simulateConnection()

      // Buffer should be cleared
      expect(server.getBufferedMessages()).toHaveLength(0)

      // Client should receive 'connected' + buffered error
      expect(client.messages).toHaveLength(2)
      expect(JSON.parse(client.messages[0])).toEqual({ type: 'connected' })
      expect(JSON.parse(client.messages[1])).toEqual(errorPayload)
    })

    it('should send all buffered messages in order', () => {
      const error1: ErrorPayload = {
        type: 'error',
        err: { message: 'Error 1', stack: '' },
      }
      const error2: ErrorPayload = {
        type: 'error',
        err: { message: 'Error 2', stack: '' },
      }

      server.send(error1)
      server.send(error2)

      const client = server.simulateConnection()

      // Client should receive: connected, error1, error2
      expect(client.messages).toHaveLength(3)
      expect(JSON.parse(client.messages[1])).toEqual(error1)
      expect(JSON.parse(client.messages[2])).toEqual(error2)
    })
  })

  describe('buffering when clients exist but not ready', () => {
    it('should buffer message when client readyState is not OPEN', () => {
      // Add a client that's not ready (CONNECTING state)
      const notReadyClient = new MockWebSocket()
      notReadyClient.readyState = 0 // CONNECTING
      server.clients.add(notReadyClient)

      const errorPayload: ErrorPayload = {
        type: 'error',
        err: { message: 'Test error', stack: '' },
      }

      server.send(errorPayload)

      // Message should be buffered since no client could receive it
      expect(server.getBufferedMessages()).toHaveLength(1)
      expect(notReadyClient.messages).toHaveLength(0)
    })

    it('should send to ready clients and not buffer', () => {
      // Connect a ready client
      const readyClient = server.simulateConnection()
      readyClient.messages = [] // Clear connection messages

      const errorPayload: ErrorPayload = {
        type: 'error',
        err: { message: 'Test error', stack: '' },
      }

      server.send(errorPayload)

      // Message should be sent, not buffered
      expect(server.getBufferedMessages()).toHaveLength(0)
      expect(readyClient.messages).toHaveLength(1)
      expect(JSON.parse(readyClient.messages[0])).toEqual(errorPayload)
    })
  })

  describe('multiple clients scenario', () => {
    it('should send to all ready clients', () => {
      const client1 = server.simulateConnection()
      const client2 = server.simulateConnection()
      client1.messages = []
      client2.messages = []

      const errorPayload: ErrorPayload = {
        type: 'error',
        err: { message: 'Test error', stack: '' },
      }

      server.send(errorPayload)

      // Both clients should receive the message
      expect(client1.messages).toHaveLength(1)
      expect(client2.messages).toHaveLength(1)
      expect(server.getBufferedMessages()).toHaveLength(0)
    })

    it('should buffer if all clients are not ready', () => {
      const client1 = server.simulateConnection()
      const client2 = server.simulateConnection()

      // Make both clients not ready
      client1.readyState = 0
      client2.readyState = 0
      client1.messages = []
      client2.messages = []

      const errorPayload: ErrorPayload = {
        type: 'error',
        err: { message: 'Test error', stack: '' },
      }

      server.send(errorPayload)

      // Message should be buffered
      expect(server.getBufferedMessages()).toHaveLength(1)
      expect(client1.messages).toHaveLength(0)
      expect(client2.messages).toHaveLength(0)
    })
  })

  describe('edge cases', () => {
    it('should handle rapid connect/disconnect cycles', () => {
      const error: ErrorPayload = {
        type: 'error',
        err: { message: 'Test error', stack: '' },
      }

      // Buffer a message
      server.send(error)

      // Connect and immediately disconnect
      const client1 = server.simulateConnection()
      server.simulateDisconnection(client1)

      // Buffer is cleared after first connection
      expect(server.getBufferedMessages()).toHaveLength(0)

      // New message should be buffered (no clients now)
      const error2: ErrorPayload = {
        type: 'error',
        err: { message: 'Test error 2', stack: '' },
      }
      server.send(error2)
      expect(server.getBufferedMessages()).toHaveLength(1)

      // New client should receive the new message
      const client2 = server.simulateConnection()
      expect(client2.messages).toHaveLength(2) // connected + error2
      expect(JSON.parse(client2.messages[1])).toEqual(error2)
    })

    it('should handle interleaved errors and full-reloads', () => {
      const error1: ErrorPayload = {
        type: 'error',
        err: { message: 'Error 1', stack: '' },
      }
      const reload: FullReloadPayload = {
        type: 'full-reload',
        path: '*',
      }
      const error2: ErrorPayload = {
        type: 'error',
        err: { message: 'Error 2', stack: '' },
      }

      server.send(error1) // Buffer: [error1]
      server.send(reload) // Buffer: [reload] (error1 cleared)
      server.send(error2) // Buffer: [reload, error2]

      const client = server.simulateConnection()

      // Client should receive: connected, reload, error2
      expect(client.messages).toHaveLength(3)
      expect(JSON.parse(client.messages[1])).toEqual(reload)
      expect(JSON.parse(client.messages[2])).toEqual(error2)
    })
  })
})
