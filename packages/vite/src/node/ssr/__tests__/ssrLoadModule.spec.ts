import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import { createServer } from '../../server'

const root = fileURLToPath(new URL('./', import.meta.url))

async function createDevServer() {
  const server = await createServer({ configFile: false, root })
  server.pluginContainer.buildStart({})
  return server
}

test('ssrLoad', async () => {
  expect.assertions(1)
  const server = await createDevServer()
  try {
    await server.ssrLoadModule('/fixtures/modules/has-invalid-import.js')
  } catch (e) {
    expect(e.message).toBe(
      'Failed to load url ./non-existent.js (resolved id: ./non-existent.js). Does the file exist?',
    )
  }
})
