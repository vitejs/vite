import { fileURLToPath } from 'node:url'
import assert from 'node:assert'
import { createServer, createViteRuntime } from 'vite'

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
// this fails as console.error(error) shows
//   Error: crash
//       at crash (.../src/has-error-deep.ts:2:9)
//       at Module.main (.../src/has-error-deep.ts:6:9)
//       at .../test-stacktrace-runtime.js:18:7
assert.match(error?.stack, /has-error-deep.ts:6:3/)
