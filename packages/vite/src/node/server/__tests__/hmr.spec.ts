import path from 'node:path'
import { expect, onTestFinished, test, vi } from 'vitest'
import { handleHMRUpdate, updateModules } from '../hmr'
import { type ServerOptions, createServer } from '../index'

async function testRestartDuringHotUpdate(serverOptions: ServerOptions = {}) {
  let hookCalls = 0
  const server = await createServer({
    configFile: false,
    root: import.meta.dirname,
    logLevel: 'silent',
    server: {
      middlewareMode: true,
      ws: false,
      ...serverOptions,
    },
    plugins: [
      {
        name: 'restart-during-hot-update',
        async hotUpdate() {
          if (hookCalls++ === 0) {
            await server.restart()
            throw new Error('hot update interrupted by restart')
          }
        },
      },
    ],
  })
  onTestFinished(async () => {
    await server.close()
  })

  await expect(
    handleHMRUpdate(
      'update',
      path.join(import.meta.dirname, 'fixture.js'),
      server,
    ),
  ).resolves.toBeUndefined()
}

test('cancels HMR when the server restarts during a hot update', async () => {
  await testRestartDuringHotUpdate()
})

test('does not schedule stale HMR with a custom environment handler', async () => {
  let hotUpdateEnvironmentsCalls = 0
  await testRestartDuringHotUpdate({
    async hotUpdateEnvironments(server, hmr) {
      hotUpdateEnvironmentsCalls++
      await Promise.all(Object.values(server.environments).map(hmr))
    },
  })
  expect(hotUpdateEnvironmentsCalls).toBe(0)
})

async function createCircularServer() {
  const server = await createServer({
    configFile: false,
    root: path.join(import.meta.dirname, 'fixtures/hmr-circular-entry'),
    logLevel: 'silent',
    server: { middlewareMode: true, ws: false },
    optimizeDeps: { noDiscovery: true },
  })
  onTestFinished(async () => {
    await server.close()
  })
  const environment = server.environments.client
  const send = vi.spyOn(environment.hot, 'send').mockImplementation(() => {})
  return { environment, send }
}

test.for(['/main.js', '/dep.js'])(
  'full reloads when %s changes in an import loop that nothing imports',
  async (url) => {
    const { environment, send } = await createCircularServer()
    await environment.transformRequest('/main.js')
    await environment.transformRequest('/dep.js')

    const mod = (await environment.moduleGraph.getModuleByUrl(url))!
    updateModules(environment, url.slice(1), [mod], Date.now())

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'full-reload' }),
    )
  },
)

test('does not reload when the import loop was not loaded', async () => {
  const { environment, send } = await createCircularServer()
  await environment.transformRequest('/main.js')

  const mod = (await environment.moduleGraph.getModuleByUrl('/dep.js'))!
  updateModules(environment, 'dep.js', [mod], Date.now())

  expect(send).not.toHaveBeenCalled()
})

test('hot updates when a boundary in the import loop was already traversed', async () => {
  const { environment, send } = await createCircularServer()
  const urls = ['main', 'app', 'dep'].map((name) => `/with-boundary/${name}.js`)
  for (const url of urls) {
    await environment.transformRequest(url)
  }

  const [, app, dep] = await Promise.all(
    urls.map((url) => environment.moduleGraph.getModuleByUrl(url)),
  )
  updateModules(environment, 'with-boundary/app.js', [app!, dep!], Date.now())

  expect(send).toHaveBeenCalledTimes(1)
  expect(send).toHaveBeenCalledWith(expect.objectContaining({ type: 'update' }))
})
