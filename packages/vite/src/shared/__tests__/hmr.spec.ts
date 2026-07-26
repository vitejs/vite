import { describe, expect, test, vi } from 'vitest'
import type { Update } from '#types/hmrPayload'
import { HMRClient, HMRContext } from '../hmr'

describe('HMRClient', () => {
  test('reports errors thrown while importing an updated module', async () => {
    const error = new SyntaxError(
      "The requested module './dep.js' does not provide an export named 'value'",
    )
    const onUpdateError = vi.fn()
    const client = new HMRClient(
      { error: vi.fn(), debug: vi.fn() },
      { send: vi.fn() },
      async () => {
        throw error
      },
      { onUpdateError },
    )

    new HMRContext(client, '/entry.js').accept()

    const update: Update = {
      type: 'js-update',
      path: '/entry.js',
      acceptedPath: '/entry.js',
      timestamp: Date.now(),
    }
    await client.queueUpdate(update)

    expect(onUpdateError).toHaveBeenCalledOnce()
    expect(onUpdateError).toHaveBeenCalledWith(error, '/entry.js')
  })
})
