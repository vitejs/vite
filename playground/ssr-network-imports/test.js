import assert from 'node:assert'
import { createServer } from 'vite'

async function runTest() {
  const server = await createServer({
    server: {
      middlewareMode: true,
    },
  })
  const mod = await server.ssrLoadModule('/src/main.js')
  assert.equal(mod.default, '18.2.0')
  await server.close()
}

runTest()
