import assert from 'node:assert'
import { fileURLToPath } from 'node:url'
import { createServer, createServerModuleRunner } from 'vite'

async function runTest(userRunner) {
  const server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('.', import.meta.url)),
    server: {
      middlewareMode: true,
    },
  })
  let mod
  if (userRunner) {
    const runner = await createServerModuleRunner(server.environments.ssr, {
      hmr: false,
    })
    mod = await runner.import('/src/network-imports.js')
  } else {
    mod = await server.ssrLoadModule('/src/network-imports.js')
  }
  assert.equal(mod.slash('foo\\bar'), 'foo/bar')
  await server.close()
}

runTest(process.argv.includes('--module-runner'))
