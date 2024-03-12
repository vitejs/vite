import assert from 'node:assert'
import { fileURLToPath } from 'node:url'
import { createServer, createViteRuntime } from 'vite'

async function runTest(useRuntime) {
  const server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('.', import.meta.url)),
    server: {
      middlewareMode: true,
    },
  })
  let mod
  if (useRuntime) {
    const runtime = await createViteRuntime(server, { hmr: false })
    mod = await runtime.executeUrl('/src/network-imports.js')
  } else {
    mod = await server.ssrLoadModule('/src/network-imports.js')
  }
  assert.equal(mod.slash('foo\\bar'), 'foo/bar')
  await server.close()
}

runTest(process.argv.includes('--runtime'))
