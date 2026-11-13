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

test('reloadModule does not cache a transform that started before it', async () => {
  let version = 'v0'
  let gate = Promise.resolve()
  let onTransform: (() => void) | undefined
  const server = await createServer({
    configFile: false,
    root: import.meta.dirname,
    logLevel: 'silent',
    server: { middlewareMode: true, ws: false },
    plugins: [
      {
        name: 'in-memory-state',
        resolveId(id) {
          if (id === 'virtual:state') return '\0virtual:state'
        },
        load(id) {
          if (id === '\0virtual:state') {
            return `export const version = ${JSON.stringify(version)}\nimport.meta.hot.accept()\n`
          }
        },
        async transform(_code, id) {
          if (id === '\0virtual:state') {
            onTransform?.()
            await gate
          }
        },
      },
    ],
  })
  onTestFinished(async () => {
    await server.close()
  })
  const env = server.environments.client
  await env.transformRequest('virtual:state')
  const mod = env.moduleGraph.getModuleById('\0virtual:state')!

  let release!: () => void
  gate = new Promise((resolve) => (release = resolve))
  version = 'v1'
  await env.reloadModule(mod)
  const transforming = new Promise<void>((resolve) => (onTransform = resolve))
  const first = env.transformRequest('virtual:state')
  await transforming

  version = 'v2'
  await env.reloadModule(mod)
  const second = env.transformRequest('virtual:state')
  release()
  await Promise.all([first, second])

  expect((await second)?.code).toContain('"v2"')
  expect((await env.transformRequest('virtual:state'))?.code).toContain('"v2"')
})
