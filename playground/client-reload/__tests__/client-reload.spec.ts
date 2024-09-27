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

  // open page and wait for connection
  const connectedPromise = page.waitForEvent('console', {
    predicate: (message) => message.text().includes('[vite] connected.'),
    timeout: 5000,
  })
  await page.goto(serverUrl)
  await connectedPromise

  // input state
  await page.locator('input').fill('hello')

  // restart and wait for reconnection after reload
  const reConnectedPromise = page.waitForEvent('console', {
    predicate: (message) => message.text().includes('[vite] connected.'),
    timeout: 5000,
  })
  await server.restart()
  await reConnectedPromise
  expect(await page.textContent('input')).toBe('')
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
