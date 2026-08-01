import path from 'node:path'
import { type Plugin, type ViteDevServer, createServer } from 'vite'
import { afterEach, describe, expect, test } from 'vitest'
import { isServe } from '~utils'

let server: ViteDevServer | undefined

afterEach(async () => {
  await server?.close()
  server = undefined
})

// A plugin virtual module reached through a dynamic import becomes a rolldown
// lazy entry whose stub id carries `?rolldown-lazy=`. The plugin only matches its
// own id, so `resolveId` returned null for the stub and the entry failed to
// compile with `UNRESOLVED_ENTRY`.
describe.runIf(isServe)('full bundle mode virtual lazy entry', () => {
  test('compiles the lazy entry of a dynamically imported virtual module', async () => {
    const errors: string[] = []
    const virtualPlugin: Plugin = {
      name: 'virtual-lazy',
      resolveId(id) {
        if (id === 'virtual:lazy-me') {
          return '\0virtual:lazy-me'
        }
      },
      load(id) {
        if (id === '\0virtual:lazy-me') {
          return 'export default "hello from a virtual module"'
        }
      },
    }

    server = await createServer({
      root: path.resolve(import.meta.dirname, 'virtual-lazy'),
      configFile: false,
      logLevel: 'silent',
      experimental: { bundledDev: true },
      plugins: [virtualPlugin],
      customLogger: {
        info() {},
        warn() {},
        warnOnce() {},
        error(msg) {
          errors.push(msg)
        },
        clearScreen() {},
        hasErrorLogged: () => false,
        hasWarned: false,
      },
    })
    await server.listen()

    const bundledDev = server.environments.client.bundledDev!
    // the lazy entry is created by the initial full build, so wait for it
    await expect
      .poll(() => bundledDev.memoryFiles.size, { timeout: 10000 })
      .toBeGreaterThan(0)

    const sizeBefore = bundledDev.memoryFiles.size
    const result = await bundledDev.triggerLazyBundling(
      '\0virtual:lazy-me?rolldown-lazy=1',
      'test-client',
    )
    expect(result).toBeDefined()

    // the compile runs a build; it must produce output instead of failing with
    // UNRESOLVED_ENTRY
    await expect
      .poll(
        () => errors.length > 0 || bundledDev.memoryFiles.size > sizeBefore,
        { timeout: 10000 },
      )
      .toBe(true)
    expect(errors).toEqual([])
  })
})
