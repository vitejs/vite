import { setTimeout } from 'node:timers/promises'
import { describe, expect, test, vi } from 'vitest'
import { HMRClient, type HMRLogger } from '../hmr'
import { normalizeModuleRunnerTransport } from '../moduleRunnerTransport'

function createClient() {
  let disconnect = () => {}
  const transport = normalizeModuleRunnerTransport({
    connect({ onDisconnection }) {
      disconnect = onDisconnection
    },
    send: vi.fn(),
  })
  const logger: HMRLogger = { error: vi.fn(), debug: vi.fn() }
  const client = new HMRClient(logger, transport, async () => ({}))
  return { client, logger, transport, disconnect: () => disconnect() }
}

describe('HMRClient.send', () => {
  test('does not log when sending before the transport connects', async () => {
    const { client, logger } = createClient()

    client.send({ type: 'custom', event: 'test', data: {} })
    await setTimeout(0)

    expect(logger.error).not.toHaveBeenCalled()
  })

  test('does not log when sending after the transport disconnects', async () => {
    const { client, logger, transport, disconnect } = createClient()
    await transport.connect!()
    disconnect()

    client.send({ type: 'custom', event: 'test', data: {} })
    await setTimeout(0)

    expect(logger.error).not.toHaveBeenCalled()
  })

  test('logs other send errors', async () => {
    const error = new Error('boom')
    const transport = normalizeModuleRunnerTransport({
      connect: vi.fn(),
      send() {
        throw error
      },
    })
    await transport.connect!()
    const logger: HMRLogger = { error: vi.fn(), debug: vi.fn() }
    const client = new HMRClient(logger, transport, async () => ({}))

    client.send({ type: 'custom', event: 'test', data: {} })
    await setTimeout(0)

    expect(logger.error).toHaveBeenCalledWith(error)
  })
})
