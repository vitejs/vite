import { createServer } from 'vite'
import assert from 'node:assert'

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
