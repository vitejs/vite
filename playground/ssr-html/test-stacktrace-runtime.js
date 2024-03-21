import { fileURLToPath } from 'node:url'
import assert from 'node:assert'
import { createServer, createViteRuntime } from 'vite'

// same test case as packages/vite/src/node/ssr/runtime/__tests__/server-source-maps.spec.ts
// implemented for e2e to catch build specific behavior

const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL('.', import.meta.url)),
  server: {
    middlewareMode: true,
  },
})

const runtime = await createViteRuntime(server, {
  sourcemapInterceptor: 'prepareStackTrace',
})

const mod = await runtime.executeEntrypoint('/src/has-error-deep.ts')
let error
try {
  mod.main()
} catch (e) {
  error = e
} finally {
  await server.close()
}
assert.match(error?.stack, /has-error-deep.ts:6:3/)
