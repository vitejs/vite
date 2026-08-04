import { afterEach, describe, expect, test, vi } from 'vitest'
import type { BundledDevUpdatePayload } from '#types/hmrPayload'
import {
  BundledDevHMRClient,
  type RolldownRuntimeLike,
} from '../bundledDevHmrClient'
import type { NormalizedModuleRunnerTransport } from '../../shared/moduleRunnerTransport'

function createClient(options?: {
  reloadAckTimeoutMs?: number
  reloadPage?: () => void
  send?: (payload: unknown) => void
}) {
  const sent: unknown[] = []
  const reloadPage = options?.reloadPage ?? vi.fn()
  const transport: NormalizedModuleRunnerTransport = {
    connect: async () => {},
    disconnect: async () => {},
    send: async (payload) => {
      sent.push(payload)
      options?.send?.(payload)
    },
    invoke: async () => undefined as never,
  }
  const runtime: RolldownRuntimeLike = {
    getImporters: () => [],
    isExecuted: () => false,
    hasFactory: () => false,
    removeModuleCache: () => {},
    initModule: () => {},
    loadExports: () => ({}),
  }
  const client = new BundledDevHMRClient(
    { error: () => {}, debug: () => {} },
    transport,
    runtime,
    {
      base: '/',
      beforeApply: () => 'continue',
      reloadAckTimeoutMs: options?.reloadAckTimeoutMs ?? 50,
      reloadPage,
    },
  )
  return { client, sent, reloadPage }
}

function push(
  client: BundledDevHMRClient,
  seq: number,
  url = `hmr_patch_${seq}.js`,
): Promise<void> {
  const payload: BundledDevUpdatePayload = {
    type: 'bundled-dev-update',
    changedIds: [],
    url,
    seq,
  }
  client.handlePush(payload)
  // flush the internal apply queue
  return (client as any).applyQueue as Promise<void>
}

describe('BundledDevHMRClient reload recovery', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test('falls back to page reload if full-reload reply times out', async () => {
    vi.useFakeTimers()
    const { client, sent, reloadPage } = createClient({
      reloadAckTimeoutMs: 50,
    })

    await push(client, 1)
    await push(client, 3) // sequence gap → requestFullReload

    expect(sent).toContainEqual({
      type: 'custom',
      event: 'vite:bundled-dev:reload-needed',
      data: {
        reason: 'hmr update sequence gap (expected 2, got 3)',
      },
    })
    expect(reloadPage).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(50)
    expect(reloadPage).toHaveBeenCalledTimes(1)
  })

  test('acknowledgeFullReload cancels the timeout', async () => {
    vi.useFakeTimers()
    const { client, reloadPage } = createClient({ reloadAckTimeoutMs: 50 })

    await push(client, 1)
    await push(client, 3)
    client.acknowledgeFullReload()

    await vi.advanceTimersByTimeAsync(200)
    expect(reloadPage).not.toHaveBeenCalled()
  })

  test('a later update while reload is pending re-requests a full reload', async () => {
    vi.useFakeTimers()
    const { client, sent, reloadPage } = createClient({
      reloadAckTimeoutMs: 5_000,
    })

    await push(client, 1)
    await push(client, 3) // pending reload
    expect(reloadPage).not.toHaveBeenCalled()
    const sentAfterFirstRequest = sent.length

    await push(client, 4) // later update while sticky flag is set
    expect(reloadPage).not.toHaveBeenCalled()
    expect(sent.length).toBeGreaterThan(sentAfterFirstRequest)
    expect(sent.at(-1)).toMatchObject({
      type: 'custom',
      event: 'vite:bundled-dev:reload-needed',
    })
  })
})
