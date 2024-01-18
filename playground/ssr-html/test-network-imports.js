import assert from 'node:assert'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

async function runTest() {
  const server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('.', import.meta.url)),
    server: {
      middlewareMode: true,
    },
  })
  const mod = await server.ssrLoadModule('/src/network-imports.js')
  assert.equal(mod.slash('foo\\bar'), 'foo/bar')
  await server.close()
}

runTest()
