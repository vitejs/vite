import { describe, expect, test, vi } from 'vitest'
import { createServer } from '../server'
import { preview } from '../preview'
import { bindCLIShortcuts } from '../shortcuts'

describe('bindCLIShortcuts', () => {
  test.each([
    ['dev server', () => createServer()],
    ['preview server', () => preview()],
  ])('binding custom shortcuts with the %s', async (_, startServer) => {
    const server = await startServer()

    try {
      const xAction = vi.fn()
      const yAction = vi.fn()

      bindCLIShortcuts(
        server,
        {
          customShortcuts: [
            { key: 'x', description: 'test x', action: xAction },
            { key: 'y', description: 'test y', action: yAction },
          ],
        },
        true,
      )

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
      bindCLIShortcuts(
        server,
        {
          customShortcuts: [
            { key: 'x', description: 'test x updated', action: xUpdatedAction },
            { key: 'z', description: 'test z', action: zAction },
          ],
        },
        true,
      )

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

  test('rebinds shortcuts after server restart', async () => {
    const server = await createServer()

    try {
      const action = vi.fn()

      bindCLIShortcuts(
        server,
        {
          customShortcuts: [{ key: 'x', description: 'test', action }],
        },
        true,
      )

      // Verify shortcut works initially
      const initialReadline = server._rl

      expect.assert(
        initialReadline,
        'The readline interface should be defined after binding shortcuts.',
      )

      initialReadline.emit('line', 'x')

      await vi.waitFor(() => expect(action).toHaveBeenCalledOnce())

      // Restart the server
      action.mockClear()
      await server.restart()

      const newReadline = server._rl

      expect.assert(
        newReadline && newReadline !== initialReadline,
        'A new readline interface should be created after server restart.',
      )

      // Shortcuts should still work after restart
      newReadline.emit('line', 'x')
      await vi.waitFor(() => expect(action).toHaveBeenCalledOnce())
    } finally {
      await server.close()
    }
  })
})
