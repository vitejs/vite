import path from 'node:path'
import { type ServerOptions, createServer } from 'vite'
import { describe, expect, onTestFinished, test } from 'vitest'
import { hmrPorts, isServe, page, ports } from '~utils'

async function testClientReload(serverOptions: ServerOptions) {
  // start server
  const server = await createServer({
    root: path.resolve(import.meta.dirname, '..'),
    logLevel: 'silent',
    server: {
      strictPort: true,
      ...serverOptions,
    },
  })
  onTestFinished(() => server.close())

  await server.listen()
  const serverUrl = server.resolvedUrls.local[0]

  // open page
  await page.goto(serverUrl)

  // input state
  await page.locator('input').fill('hello')

  // restart
  const reloadPromise = page.waitForEvent('load')
  await server.restart()

  // wait for reload and check state is cleared
  await reloadPromise
  await expect.poll(() => page.locator('input').textContent()).toBe('')
}

describe.runIf(isServe)('client-reload', () => {
  test('default', async () => {
    await testClientReload({
      port: ports['client-reload'],
    })
  })

  test('custom hmr port', async () => {
    await testClientReload({
      port: ports['client-reload'],
      hmr: {
        port: hmrPorts['client-reload'],
      },
    })
  })

  test('custom hmr port and cross origin isolation', async () => {
    await testClientReload({
      port: ports['client-reload'],
      hmr: {
        port: hmrPorts['client-reload'],
      },
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    })
  })
})
