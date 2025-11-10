import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createServer } from '../server'
import { preview } from '../preview'
import { bindCLIShortcuts } from '../shortcuts'

describe('bindCLIShortcuts', () => {
  const originalIsTTY = process.stdin.isTTY

  beforeEach(() => {
    process.stdin.isTTY = true
    vi.stubEnv('CI', '')
  })

  afterEach(() => {
    process.stdin.isTTY = originalIsTTY
    vi.unstubAllEnvs()
  })

  test.each([
    ['dev server', () => createServer()],
    ['preview server', () => preview()],
  ])('binding custom shortcuts with the %s', async (_, startServer) => {
    const server = await startServer()

    try {
      const xAction = vi.fn()
      const yAction = vi.fn()

      bindCLIShortcuts(server, {
        customShortcuts: [
          { key: 'x', description: 'test x', action: xAction },
          { key: 'y', description: 'test y', action: yAction },
        ],
      })

      expect.assert(
        server._rl,
        'The readline interface should be defined after binding shortcuts.',
      )
      expect(xAction).not.toHaveBeenCalled()

      server._rl.emit('line', 'x')
      await vi.waitFor(() => expect(xAction).toHaveBeenCalledOnce())

      const xUpdatedAction = vi.fn()
      const zAction = vi.fn()

      xAction.mockClear()
      bindCLIShortcuts(server, {
        customShortcuts: [
          { key: 'x', description: 'test x updated', action: xUpdatedAction },
          { key: 'z', description: 'test z', action: zAction },
        ],
      })

      expect(xUpdatedAction).not.toHaveBeenCalled()
      server._rl.emit('line', 'x')
      await vi.waitFor(() => expect(xUpdatedAction).toHaveBeenCalledOnce())

      // Ensure original xAction is not called again
      expect(xAction).not.toBeCalled()

      expect(yAction).not.toHaveBeenCalled()
      server._rl.emit('line', 'y')
      await vi.waitFor(() => expect(yAction).toHaveBeenCalledOnce())

      expect(zAction).not.toHaveBeenCalled()
      server._rl.emit('line', 'z')
      await vi.waitFor(() => expect(zAction).toHaveBeenCalledOnce())
    } finally {
      await server.close()
    }
  })
})
