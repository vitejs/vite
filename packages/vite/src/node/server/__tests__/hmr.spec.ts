import path from 'node:path'
import { expect, onTestFinished, test } from 'vitest'
import type { DevEnvironment } from '../environment'
import { handleHMRUpdate } from '../hmr'
import { createServer } from '../index'

test('uses the environment snapshot when the server restarts during HMR', async () => {
  let hookCalls = 0
  const server = await createServer({
    configFile: false,
    root: import.meta.dirname,
    logLevel: 'silent',
    server: {
      middlewareMode: true,
      ws: false,
    },
    plugins: [
      {
        name: 'restart-during-hot-update',
        async hotUpdate() {
          if (hookCalls++ === 0) {
            server.environments.client = {} as DevEnvironment
            throw new Error('hot update interrupted by restart')
          }
        },
      },
    ],
  })
  const clientEnvironment = server.environments.client
  onTestFinished(async () => {
    server.environments.client = clientEnvironment
    await server.close()
  })

  await expect(
    handleHMRUpdate(
      'update',
      path.join(import.meta.dirname, 'fixture.js'),
      server,
    ),
  ).resolves.toBeUndefined()
})
