import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { expect, test } from 'vitest'
import { createServer } from '../server'
import { createServerModuleRunner } from '../ssr/runtime/serverModuleRunner'
import type { ResolveIdFn } from '../idResolver'
import { createBackCompatIdResolver } from '../idResolver'
import { normalizePath } from '../utils'

const root = fileURLToPath(new URL('./', import.meta.url))

async function createDevServer() {
  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'silent',
    plugins: [
      (() => {
        let idResolver: ResolveIdFn
        return {
          name: 'environment-alias-test-plugin',
          configResolved(config) {
            idResolver = createBackCompatIdResolver(config)
          },
          async resolveId(id) {
            return await idResolver(this.environment, id)
          },
        }
      })(),
    ],
    environments: {
      client: {
        resolve: {
          alias: [
            {
              find: 'mod',
              replacement: '/fixtures/environment-alias/test.client.js',
            },
          ],
        },
      },
      ssr: {
        resolve: {
          alias: [
            {
              find: 'mod',
              replacement: '/fixtures/environment-alias/test.ssr.js',
            },
          ],
        },
      },
      rsc: {
        resolve: {
          alias: [
            {
              find: 'mod',
              replacement: '/fixtures/environment-alias/test.rsc.js',
            },
          ],
        },
      },
    },
  })

  const moduleRunner = createServerModuleRunner(server.environments.rsc)
  return { server, moduleRunner }
}

test('alias', async () => {
  expect.assertions(7)
  const { server, moduleRunner } = await createDevServer()

  const [clientId, ssrId, rscId, clientReq, ssrReq, rscReq, rscMod] =
    await Promise.all([
      server.environments.client.pluginContainer.resolveId('mod'),
      server.environments.ssr.pluginContainer.resolveId('mod'),
      server.environments.rsc.pluginContainer.resolveId('mod'),
      server.environments.client.transformRequest('mod'),
      server.environments.ssr.transformRequest('mod'),
      server.environments.rsc.transformRequest('mod'),
      moduleRunner.import('mod'),
    ])

  expect(clientId?.id).toEqual(
    normalizePath(
      path.join(root, '/fixtures/environment-alias/test.client.js'),
    ),
  )
  expect(ssrId?.id).toEqual(
    normalizePath(path.join(root, '/fixtures/environment-alias/test.ssr.js')),
  )
  expect(rscId?.id).toEqual(
    normalizePath(path.join(root, '/fixtures/environment-alias/test.rsc.js')),
  )

  expect(clientReq?.code ?? '').toContain('(client)')
  expect(ssrReq?.code ?? '').toContain('(ssr)')
  expect(rscReq?.code ?? '').toContain('(rsc)')

  expect(rscMod?.msg).toContain('(rsc)')
})
