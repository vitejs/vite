import { afterEach, describe, expect, test, vi } from 'vitest'
import { createWebSocketModuleRunnerTransport } from '../moduleRunnerTransport'

describe('createWebSocketModuleRunnerTransport', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  function openSocket() {
    return {
      readyState: 1,
      OPEN: 1,
      send: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
    }
  }

  test('pingInterval: 0 does not schedule a ping timer', async () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    const socket = openSocket()
    const transport = createWebSocketModuleRunnerTransport({
      createConnection: () => socket as unknown as WebSocket,
      pingInterval: 0,
    })
    await transport.connect({
      onMessage: () => {},
      onDisconnection: () => {},
    })
    expect(setIntervalSpy).not.toHaveBeenCalled()
    await transport.disconnect()
  })

  test('default pingInterval still schedules a ping timer', async () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    const socket = openSocket()
    const transport = createWebSocketModuleRunnerTransport({
      createConnection: () => socket as unknown as WebSocket,
    })
    await transport.connect({
      onMessage: () => {},
      onDisconnection: () => {},
    })
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000)
    await transport.disconnect()
  })
})
