import type { Mock } from 'vitest'
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
        server._shortcutsState?.rl,
        'The readline interface should be defined after binding shortcuts.',
      )
      expect(xAction).not.toHaveBeenCalled()

      server._shortcutsState.rl.emit('line', 'x')
      await vi.waitFor(() => expect(xAction).toHaveBeenCalledOnce())

      const xUpdatedAction = vi.fn()
      const zAction = vi.fn()

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
      server._shortcutsState.rl.emit('line', 'x')
      await vi.waitFor(() => expect(xUpdatedAction).toHaveBeenCalledOnce())

      // Ensure original xAction is not called again
      expect(xAction).toHaveBeenCalledOnce()

      expect(yAction).not.toHaveBeenCalled()
      server._shortcutsState.rl.emit('line', 'y')
      await vi.waitFor(() => expect(yAction).toHaveBeenCalledOnce())

      expect(zAction).not.toHaveBeenCalled()
      server._shortcutsState.rl.emit('line', 'z')
      await vi.waitFor(() => expect(zAction).toHaveBeenCalledOnce())
    } finally {
      await server.close()
    }
  })

  test('rebinds shortcuts after server restart', async () => {
    const manualShortcutAction = vi.fn()
    const pluginShortcutActions: Array<Mock<any>> = []

    const server = await createServer({
      plugins: [
        {
          name: 'custom-shortcut-plugin',
          configureServer(viteDevServer) {
            const action = vi.fn()

            // Keep track of actions created by the plugin
            // To verify if they are overwritten on server restart
            pluginShortcutActions.push(action)

            // Bind custom shortcut from plugin
            bindCLIShortcuts(
              viteDevServer,
              {
                customShortcuts: [
                  {
                    key: 'y',
                    description: 'plugin shortcut',
                    action,
                  },
                ],
              },
              true,
            )
          },
        },
      ],
    })

    try {
      const readline = server._shortcutsState?.rl

      expect.assert(
        readline,
        'The readline interface should be defined after binding shortcuts.',
      )

      readline.emit('line', 'y')
      await vi.waitFor(() => {
        expect(pluginShortcutActions).toHaveLength(1)
        expect(pluginShortcutActions[0]).toHaveBeenCalledOnce()
      })

      // Manually bind another custom shortcut
      bindCLIShortcuts(
        server,
        {
          customShortcuts: [
            {
              key: 'x',
              description: 'manual shortcut',
              action: manualShortcutAction,
            },
          ],
        },
        true,
      )

      readline.emit('line', 'x')
      await vi.waitFor(() =>
        expect(manualShortcutAction).toHaveBeenCalledOnce(),
      )

      // Check the order of shortcuts before restart
      expect(
        server._shortcutsState?.options.customShortcuts?.map((s) => s.key),
      ).toEqual(['x', 'y'])

      // Restart the server
      await server.restart()

      // Shortcut orders should be preserved after restart
      expect(
        server._shortcutsState?.options.customShortcuts?.map((s) => s.key),
      ).toEqual(['x', 'y'])

      expect.assert(
        server._shortcutsState?.rl === readline,
        'The readline interface should be preserved.',
      )

      // Shortcuts should still work after restart
      readline.emit('line', 'x')
      await vi.waitFor(() =>
        expect(manualShortcutAction).toHaveBeenCalledTimes(2),
      )

      readline.emit('line', 'y')
      await vi.waitFor(() => {
        expect(pluginShortcutActions).toHaveLength(2)
        expect(pluginShortcutActions[1]).toHaveBeenCalledOnce()
        expect(pluginShortcutActions[0]).toHaveBeenCalledOnce()
      })
    } finally {
      await server.close()
    }
  })
})
