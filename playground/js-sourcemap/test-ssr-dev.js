import assert from 'node:assert'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

async function runTest() {
  const server = await createServer({
    root: fileURLToPath(new URL('.', import.meta.url)),
    configFile: false,
    optimizeDeps: {
      noDiscovery: true,
    },
    server: {
      middlewareMode: true,
      hmr: false,
      ws: false,
    },
    define: {
      __testDefineObject: '{ "hello": "test" }',
    },
  })
  const mod = await server.ssrLoadModule('/with-define-object-ssr.ts')
  const error = await getError(() => mod.error())
  server.ssrFixStacktrace(error)
  assert.match(error.stack, /at errorInner (.*with-define-object-ssr.ts:7:9)/)
  await server.close()
}

async function getError(f) {
  let error
  try {
    await f()
  } catch (e) {
    error = e
  }
  assert.ok(error)
  return error
}

runTest()
