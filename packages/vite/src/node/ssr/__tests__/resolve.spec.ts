import { fileURLToPath } from 'node:url'
import { describe, expect, onTestFinished, test } from 'vitest'
import { createServer } from '../../server'

describe('exports', () => {
  async function testServer() {
    const server = await createServer({
      clearScreen: false,
      configFile: false,
      root: fileURLToPath(new URL('.', import.meta.url)),
    })
    await server.pluginContainer.buildStart({})
    onTestFinished(async () => {
      await server.close()
    })
    return server
  }

  test('resolveId ssr', async () => {
    const server = await testServer()
    const resolved = await server.pluginContainer.resolveId(
      '@vitejs/test-mix-dep',
      undefined,
      {
        ssr: true,
      },
    )
    expect(resolved?.id).toContain('index.cjs.mjs')
  })

  test('resolveId no-ssr', async () => {
    const server = await testServer()
    const resolved = await server.pluginContainer.resolveId(
      '@vitejs/test-mix-dep',
    )
    expect(resolved?.id).toContain('index.esm.js')
  })

  test('ssrLoadModule direct', async () => {
    const server = await testServer()
    const mod = await server.ssrLoadModule('@vitejs/test-mix-dep')
    expect(mod.default).toEqual('import')
  })

  test('ssrLoadModule external', async () => {
    const server = await testServer()
    const mod = await server.ssrLoadModule('/fixtures/entry-mix-dep')
    expect(mod.default).toEqual('import')
  })
})
