import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createServer } from '../server'
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

  test('binding custom shortcuts with the dev server', async () => {
    const server = await createServer({
      server: { host: 'localhost', port: 0 },
    })
    const xAction = vi.fn()
    const yAction = vi.fn()

    bindCLIShortcuts(server, {
      customShortcuts: [
        {
          key: 'x',
          description: 'shortcut that is overriden in the 2nd call',
          action: xAction,
        },
        {
          key: 'y',
          description: 'shortcut that is omitted from 2nd call',
          action: yAction,
        },
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
        {
          key: 'x',
          description: 'new shortcut with duplicated "x" key',
          action: xUpdatedAction,
        },
        { key: 'z', description: 'new shortcut with new key', action: zAction },
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
  })
})
