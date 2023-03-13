import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import { createServer } from '../../server'

const root = fileURLToPath(new URL('./', import.meta.url))

async function createDevServer() {
  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'silent',
  })
  server.pluginContainer.buildStart({})
  return server
}

test('call rewriteStacktrace twice', async () => {
  const server = await createDevServer()
  for (let i = 0; i < 2; i++) {
    try {
      await server.ssrLoadModule('/fixtures/modules/has-error.js')
    } catch (e) {
      server.ssrFixStacktrace(e)
    }
  }
})
