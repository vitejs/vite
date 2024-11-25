import { assert, expect, test } from 'vitest'
import type { ViteHotContext } from 'types/hot'
import { createServer } from '../../../server'
import { DevEnvironment } from '../../../server/environment'
import { createServerFetchTransport } from '../../../server/fetchTransport'
import { ESModulesEvaluator, ModuleRunner } from '../../../../module-runner'
import { createClientFetchTransport } from '../../../../module-runner/fetchTransport'

test('fetch transport', async () => {
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
            return new DevEnvironment(name, config, {
              transport: createServerFetchTransport(),
            })
          },
        },
      },
    },
  })
  await server.listen()

  const runner = new ModuleRunner(
    {
      root: server.config.root,
      sourcemapInterceptor: false,
      hmr: true,
      transport: createClientFetchTransport('custom', 'http://localhost:5010'),
    },
    new ESModulesEvaluator(),
  )

  const mod = await runner.import('/fixtures/basic.js')
  expect(mod.name).toBe('basic')

  // hot api
  const { hmr: importMetaHot } = (await runner.import('/fixtures/hmr.js')) as {
    hmr: ViteHotContext
  }
  assert(importMetaHot)

  const serverToClient = await new Promise((resolve) => {
    importMetaHot.on('test-event-server', (payload) => {
      resolve(payload)
    })
    server.environments['custom'].hot.send('test-event-server', 'ok')
  })
  expect(serverToClient).toEqual('ok')

  const clientToServer = await new Promise((resolve) => {
    server.environments['custom'].hot.on('test-event-client', (payload) => {
      resolve(payload)
    })
    importMetaHot.send('test-event-client', 'ok')
  })
  expect(clientToServer).toEqual('ok')

  // multiple runners
  const runner2 = new ModuleRunner(
    {
      root: server.config.root,
      sourcemapInterceptor: false,
      hmr: true,
      transport: createClientFetchTransport('custom', 'http://localhost:5010'),
    },
    new ESModulesEvaluator(),
  )
  const mod2 = await runner2.import('/fixtures/basic.js')
  expect(mod2.name).toBe('basic')
})
