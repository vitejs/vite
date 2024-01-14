import assert from 'node:assert'
import { createServer } from 'vite'

async function runTest() {
  const server = await createServer({
    configFile: false,
    server: {
      middlewareMode: true,
    },
  })
  const mod = await server.ssrLoadModule('/src/network-imports.js')
  assert.equal(mod.slash('foo\\bar'), 'foo/bar')
  await server.close()
}

runTest()
