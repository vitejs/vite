import { createRunnableDevEnvironment, createServer } from 'vite'
import { createFetchableModuleRunner } from 'vite/module-runner'
import { expect, test } from 'vitest'

test('fetchable module runner works correctly', async () => {
  const server = await createServer({
    root: import.meta.dirname,
    server: {
      port: 5010,
      watch: null,
      hmr: false,
    },
    environments: {
      custom: {
        dev: {
          createEnvironment(name, config) {
            return createRunnableDevEnvironment(name, config, {
              hot: false,
            })
          },
        },
      },
    },
  })
  await server.listen()

  const runner = createFetchableModuleRunner({
    root: server.config.root,
    serverURL: 'http://localhost:5010',
    environmentName: 'custom',
    sourcemapInterceptor: false,
  })

  const mod = await runner.import('/fixtures/basic.js')
  expect(mod.name).toBe('basic')
})
