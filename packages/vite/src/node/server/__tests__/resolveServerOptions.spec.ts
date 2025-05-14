import { describe, expect, it, vi } from 'vitest'
import { resolveServerOptions } from '../index'

describe('resolveServerOptions', () => {
  const root = '/test'
  const logger = {
    warn: vi.fn(),
  } as any

  it('should use a default hostname when no host is provided', async () => {
    const resolvedOptions = await resolveServerOptions(root, {}, logger)

    expect(resolvedOptions.hostname).toStrictEqual({
      host: 'localhost',
      name: 'localhost',
    })
  })

  it('should resolve the hostname correctly', async () => {
    const options = {
      host: '127.0.0.1',
    }
    const resolvedOptions = await resolveServerOptions(root, options, logger)

    expect(resolvedOptions.hostname).toStrictEqual({
      host: '127.0.0.1',
      name: '127.0.0.1',
    })
  })
})
