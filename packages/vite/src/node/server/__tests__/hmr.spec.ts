import path from 'node:path'
import { expect, onTestFinished, test } from 'vitest'
import { handleHMRUpdate } from '../hmr'
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

test('refreshes imports above a self-accepting boundary while preserving the parent URL', async () => {
  const sources: Record<string, string> = {
    '/dep.js': 'export const value = 1',
    '/boundary.js':
      'import "/dep.js"; if (import.meta.hot) import.meta.hot.accept()',
    '/parent.js': 'import "/boundary.js"; export const singleton = {}',
    '/lazy.js': 'export { singleton } from "/parent.js"',
  }
  let parentTransforms = 0
  const server = await createServer({
    configFile: false,
    root: import.meta.dirname,
    logLevel: 'silent',
    server: { middlewareMode: true, ws: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
    plugins: [
      {
        name: 'self-accepting-boundary',
        resolveId(id) {
          if (id in sources) return id
        },
        load(id) {
          return sources[id]
        },
        transform(_code, id) {
          if (id === '/parent.js') parentTransforms++
        },
      },
    ],
  })
  onTestFinished(() => server.close())
  const environment = server.environments.client
  await environment.transformRequest('/dep.js')
  await environment.transformRequest('/boundary.js')
  await environment.transformRequest('/parent.js')
  const dep = environment.moduleGraph.getModuleById('/dep.js')!
  const timestamp = 1234567890123

  environment.moduleGraph.invalidateModule(dep, new Set(), timestamp, true)

  const parent = await environment.transformRequest('/parent.js')
  expect(parent?.code).toContain(`/boundary.js?t=${timestamp}`)
  expect(parentTransforms).toBe(1)
  const lazy = await environment.transformRequest('/lazy.js')
  expect(lazy?.code).toContain('from "/parent.js"')
  expect(lazy?.code).not.toContain('/parent.js?t=')
})
