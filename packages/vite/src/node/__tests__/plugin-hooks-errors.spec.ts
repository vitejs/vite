import { afterEach, describe, expect, test } from 'vitest'
import { resolveConfig } from '../config'
import { createServer } from '../server'

const servers = [] as Awaited<ReturnType<typeof createServer>>[]

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()))
})

describe('plugin hook error metadata', () => {
  test.each([
    ['config', 'config'] as const,
    ['configResolved', 'configResolved'] as const,
  ])('annotates errors from %s hooks', async (hook, hookName) => {
    await expect(
      resolveConfig(
        {
          configFile: false,
          plugins: [
            {
              name: `throws-${hook}`,
              [hook]() {
                throw new Error('boom')
              },
            },
          ],
        },
        'serve',
      ),
    ).rejects.toMatchObject({ plugin: `throws-${hook}`, hook: hookName })
  })

  test('annotates errors from configureServer hooks', async () => {
    await expect(
      createServer({
        configFile: false,
        plugins: [
          {
            name: 'throws-configureServer',
            configureServer() {
              throw new Error('boom')
            },
          },
        ],
      }),
    ).rejects.toMatchObject({
      plugin: 'throws-configureServer',
      hook: 'configureServer',
    })
  })

  test('annotates errors from dev buildStart hooks', async () => {
    const server = await createServer({
      configFile: false,
      plugins: [
        {
          name: 'throws-buildStart',
          buildStart() {
            throw new Error('boom')
          },
        },
      ],
    })
    servers.push(server)

    await expect(
      server.environments.client.pluginContainer.buildStart(),
    ).rejects.toMatchObject({ plugin: 'throws-buildStart', hook: 'buildStart' })
  })
})
