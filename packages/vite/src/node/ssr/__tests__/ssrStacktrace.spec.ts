import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import { createServer } from '../../server'

const root = fileURLToPath(new URL('./', import.meta.url))

async function createDevServer() {
  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'silent',
    optimizeDeps: {
      noDiscovery: true,
    },
  })
  await server.environments.ssr.pluginContainer.buildStart({})
  return server
}

test('call rewriteStacktrace twice', async () => {
  const server = await createDevServer()
  for (let i = 0; i < 2; i++) {
    try {
      await server.ssrLoadModule('/fixtures/modules/has-error.js')
    } catch (e: any) {
      server.ssrFixStacktrace(e)
    }
  }
})

test('outputs message when stacktrace appears to be already rewritten', async () => {
  const server = await createDevServer()
  try {
    await server.ssrLoadModule('/fixtures/modules/has-error.js')
  } catch (e: any) {
    // Manually craft an already-rewritten stacktrace with invalid line/column
    // that will trigger the alreadyRewritten flag
    e.stack = e.stack.replace(
      /fixtures\/modules\/has-error\.js:\d+:\d+/,
      'fixtures/modules/has-error.js:1:1',
    )
    server.ssrFixStacktrace(e)
    expect(e.message).toContain(
      'The stacktrace appears to be already rewritten by something else',
    )
  }
})
