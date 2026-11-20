import { dev } from 'rolldown/experimental'
import type { HotChannelClient } from 'vite'
import { describe, expect, it, vi } from 'vitest'
import { BundledDev } from '../bundledDev'
import type { DevEnvironment } from '../environment'

vi.mock('rolldown/experimental', async (importOriginal) => {
  const actual = await importOriginal<typeof import('rolldown/experimental')>()
  return {
    ...actual,
    dev: vi.fn(),
  }
})

interface MockContext {
  bundledDev: BundledDev
  mockEngine: {
    notifyPayloadDelivered: ReturnType<typeof vi.fn>
    removeClient: ReturnType<typeof vi.fn>
    registerClient: ReturnType<typeof vi.fn>
    run: ReturnType<typeof vi.fn>
    close: ReturnType<typeof vi.fn>
    ensureCurrentBuildFinish: ReturnType<typeof vi.fn>
    getBundleState: ReturnType<typeof vi.fn>
  }
  hotListeners: Map<string, (...args: any[]) => any>
}

async function setupBundledDev(): Promise<MockContext> {
  const hotListeners = new Map<string, (...args: any[]) => any>()
  const env = {
    hot: {
      on: vi.fn((event: string, cb: (...args: any[]) => any) => {
        hotListeners.set(event, cb)
      }),
      send: vi.fn(),
    },
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    },
    config: {
      root: '/root',
      consumer: 'client',
      server: {
        watch: {},
      },
    },
  } as unknown as DevEnvironment

  const mockEngine = {
    notifyPayloadDelivered: vi.fn(),
    removeClient: vi.fn().mockResolvedValue(undefined),
    registerClient: vi.fn().mockResolvedValue(undefined),
    run: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    ensureCurrentBuildFinish: vi.fn().mockResolvedValue(undefined),
    getBundleState: vi.fn().mockResolvedValue({ lastBuildErrored: true }),
  }
  vi.mocked(dev).mockResolvedValue(mockEngine as any)

  const bundledDev = new BundledDev(env)
  vi.spyOn(bundledDev as any, 'getRolldownOptions').mockResolvedValue({
    input: { main: '/root/index.js' },
    output: {},
  })
  vi.spyOn(bundledDev as any, 'storeStaticFiles').mockResolvedValue(undefined)

  await bundledDev.listen()
  ;(bundledDev as any)._devEngine = mockEngine

  return { bundledDev, mockEngine, hotListeners }
}

function createFakeClient(): HotChannelClient {
  return {
    send: vi.fn(),
  } as unknown as HotChannelClient
}

describe('BundledDev pending payload tracking & event handling', () => {
  it('tracks pending payloads for multiple clients independently with full map synchronization', async () => {
    const { bundledDev, mockEngine, hotListeners } = await setupBundledDev()

    const client1 = createFakeClient()
    const client2 = createFakeClient()

    // Connect clients through the real WebSocket event handler
    await hotListeners.get('vite:client-connected')!(
      { clientId: 'client-1' },
      client1,
    )
    await hotListeners.get('vite:client-connected')!(
      { clientId: 'client-2' },
      client2,
    )

    // Register payloads for both clients
    ;(bundledDev as any).addPendingPayload('chunk-1a.js', 'client-1')
    ;(bundledDev as any).addPendingPayload('chunk-1b.js', 'client-1')
    ;(bundledDev as any).addPendingPayload('chunk-2a.js', 'client-2')

    // Scoped counts
    expect(bundledDev.getPendingPayloadCount('client-1')).toBe(2)
    expect(bundledDev.getPendingPayloadCount('client-2')).toBe(1)
    expect(bundledDev.getPendingPayloadCount('unknown-client')).toBe(0)
    expect(bundledDev.getPendingPayloadCount()).toBe(3)

    // Verify reverse mapping and sets remain synchronized
    expect((bundledDev as any).payloadToClient.get('chunk-1a.js')).toBe(
      'client-1',
    )
    expect((bundledDev as any).payloadToClient.get('chunk-1b.js')).toBe(
      'client-1',
    )
    expect((bundledDev as any).payloadToClient.get('chunk-2a.js')).toBe(
      'client-2',
    )
    expect((bundledDev as any).pendingPayloadFilenames.has('chunk-1a.js')).toBe(
      true,
    )
    expect((bundledDev as any).clientPendingPayloads.get('client-1').size).toBe(
      2,
    )

    // Acknowledge chunk-1a via real payload-delivered event
    hotListeners.get('vite:bundled-dev:payload-delivered')!({
      filename: 'chunk-1a.js',
    })
    expect(mockEngine.notifyPayloadDelivered).toHaveBeenCalledTimes(1)
    expect(mockEngine.notifyPayloadDelivered).toHaveBeenCalledWith(
      'chunk-1a.js',
    )

    expect(bundledDev.getPendingPayloadCount('client-1')).toBe(1)
    expect(bundledDev.getPendingPayloadCount('client-2')).toBe(1)
    expect(bundledDev.getPendingPayloadCount()).toBe(2)
    expect((bundledDev as any).payloadToClient.has('chunk-1a.js')).toBe(false)

    // Acknowledge chunk-1b - client-1 map entry should be cleaned up when empty
    hotListeners.get('vite:bundled-dev:payload-delivered')!({
      filename: 'chunk-1b.js',
    })
    expect(bundledDev.getPendingPayloadCount('client-1')).toBe(0)
    expect((bundledDev as any).clientPendingPayloads.has('client-1')).toBe(
      false,
    )
    expect(bundledDev.getPendingPayloadCount('client-2')).toBe(1)
    expect(bundledDev.getPendingPayloadCount()).toBe(1)
  })

  it('cleans up pending payloads on actual WebSocket disconnect without corrupting other clients', async () => {
    const { bundledDev, mockEngine, hotListeners } = await setupBundledDev()

    const clientA = createFakeClient()
    const clientB = createFakeClient()

    await hotListeners.get('vite:client-connected')!(
      { clientId: 'client-a' },
      clientA,
    )
    await hotListeners.get('vite:client-connected')!(
      { clientId: 'client-b' },
      clientB,
    )

    ;(bundledDev as any).addPendingPayload('payload-a1.js', 'client-a')
    ;(bundledDev as any).addPendingPayload('payload-a2.js', 'client-a')
    ;(bundledDev as any).addPendingPayload('payload-b1.js', 'client-b')

    expect(bundledDev.getPendingPayloadCount()).toBe(3)

    // Disconnect client-a via actual WebSocket disconnect event
    hotListeners.get('vite:client:disconnect')!({}, clientA)

    expect(mockEngine.removeClient).toHaveBeenCalledWith('client-a')
    expect(bundledDev.getPendingPayloadCount('client-a')).toBe(0)
    expect((bundledDev as any).clientPendingPayloads.has('client-a')).toBe(
      false,
    )
    expect((bundledDev as any).payloadToClient.has('payload-a1.js')).toBe(false)
    expect((bundledDev as any).payloadToClient.has('payload-a2.js')).toBe(false)

    // Client-b state must remain completely intact
    expect(bundledDev.getPendingPayloadCount('client-b')).toBe(1)
    expect(bundledDev.getPendingPayloadCount()).toBe(1)
    expect((bundledDev as any).payloadToClient.get('payload-b1.js')).toBe(
      'client-b',
    )

    // Delivery of client-b payload still works cleanly
    hotListeners.get('vite:bundled-dev:payload-delivered')!({
      filename: 'payload-b1.js',
    })
    expect(mockEngine.notifyPayloadDelivered).toHaveBeenCalledWith(
      'payload-b1.js',
    )
    expect(bundledDev.getPendingPayloadCount()).toBe(0)
  })

  it('safely handles acknowledgements arriving after client disconnect', async () => {
    const { bundledDev, mockEngine, hotListeners } = await setupBundledDev()

    const client = createFakeClient()
    await hotListeners.get('vite:client-connected')!(
      { clientId: 'client-x' },
      client,
    )

    ;(bundledDev as any).addPendingPayload('in-flight.js', 'client-x')
    expect(bundledDev.getPendingPayloadCount('client-x')).toBe(1)

    // Client disconnects before in-flight packet evaluates
    hotListeners.get('vite:client:disconnect')!({}, client)
    expect(bundledDev.getPendingPayloadCount('client-x')).toBe(0)

    // Belated delivery packet arrives from network
    hotListeners.get('vite:bundled-dev:payload-delivered')!({
      filename: 'in-flight.js',
    })

    // Must be ignored safely without notifying engine or corrupting state
    expect(mockEngine.notifyPayloadDelivered).not.toHaveBeenCalled()
    expect(bundledDev.getPendingPayloadCount()).toBe(0)
  })

  it('handles payloads generated without an associated client ID', async () => {
    const { bundledDev, mockEngine, hotListeners } = await setupBundledDev()

    // Add payload without client ID
    ;(bundledDev as any).addPendingPayload('shared-runtime.js', undefined)

    // Tracked in global count, but not attached to any client
    expect(bundledDev.getPendingPayloadCount()).toBe(1)
    expect(bundledDev.getPendingPayloadCount('client-1')).toBe(0)
    expect((bundledDev as any).payloadToClient.has('shared-runtime.js')).toBe(
      false,
    )

    // Deliver payload
    hotListeners.get('vite:bundled-dev:payload-delivered')!({
      filename: 'shared-runtime.js',
    })
    expect(mockEngine.notifyPayloadDelivered).toHaveBeenCalledTimes(1)
    expect(mockEngine.notifyPayloadDelivered).toHaveBeenCalledWith(
      'shared-runtime.js',
    )
    expect(bundledDev.getPendingPayloadCount()).toBe(0)
  })

  it('resetClient cleans up previous client state and pending payloads', async () => {
    const { bundledDev, mockEngine, hotListeners } = await setupBundledDev()

    const client = createFakeClient()
    await hotListeners.get('vite:client-connected')!(
      { clientId: 'client-v1' },
      client,
    )

    ;(bundledDev as any).addPendingPayload('stale-entry.js', 'client-v1')
    expect(bundledDev.getPendingPayloadCount('client-v1')).toBe(1)

    // Navigation / full reload calls resetClient
    await bundledDev.resetClient('client-v1', 'client-v2')

    // Old client state purged
    expect(bundledDev.getPendingPayloadCount('client-v1')).toBe(0)
    expect(bundledDev.getPendingPayloadCount('client-v2')).toBe(0)
    expect(bundledDev.getPendingPayloadCount()).toBe(0)
    expect((bundledDev as any).payloadToClient.has('stale-entry.js')).toBe(
      false,
    )

    // Engine client lifecycle invoked
    expect(mockEngine.removeClient).toHaveBeenCalledWith('client-v1')
    expect(mockEngine.registerClient).toHaveBeenCalledWith('client-v2')
  })

  it('close() clears all pending data structures and closes engine', async () => {
    const { bundledDev, mockEngine, hotListeners } = await setupBundledDev()

    const client = createFakeClient()
    await hotListeners.get('vite:client-connected')!(
      { clientId: 'client-1' },
      client,
    )

    ;(bundledDev as any).addPendingPayload('payload-1.js', 'client-1')
    ;(bundledDev as any).addPendingPayload('global.js', undefined)
    expect(bundledDev.getPendingPayloadCount()).toBe(2)

    await bundledDev.close()

    expect(bundledDev.getPendingPayloadCount()).toBe(0)
    expect(bundledDev.getPendingPayloadCount('client-1')).toBe(0)
    expect((bundledDev as any).pendingPayloadFilenames.size).toBe(0)
    expect((bundledDev as any).clientPendingPayloads.size).toBe(0)
    expect((bundledDev as any).payloadToClient.size).toBe(0)
    expect(mockEngine.close).toHaveBeenCalledTimes(1)
  })

  it('test synchronization does not block unrelated browser sessions', async () => {
    const { bundledDev, hotListeners } = await setupBundledDev()

    const session1 = createFakeClient()
    const session2 = createFakeClient()

    await hotListeners.get('vite:client-connected')!(
      { clientId: 'session-1' },
      session1,
    )
    await hotListeners.get('vite:client-connected')!(
      { clientId: 'session-2' },
      session2,
    )

    // Session 2 has a slow lazy chunk pending in the browser
    ;(bundledDev as any).addPendingPayload('heavy-chunk.js', 'session-2')

    // Session 1 is completely idle with 0 pending payloads
    expect(bundledDev.getPendingPayloadCount('session-1')).toBe(0)
    expect(bundledDev.getPendingPayloadCount('session-2')).toBe(1)

    // A helper inspecting session-1 sees 0 and does not wait or block on session-2
    const session1Pending = bundledDev.getPendingPayloadCount('session-1')
    expect(session1Pending).toBe(0)
  })
})
