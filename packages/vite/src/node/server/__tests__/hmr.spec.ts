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

test('discards a transform that started before HMR invalidation', async () => {
  const fixture = path.join(import.meta.dirname, 'hmr-inflight-fixture.js')
  let blockTransform = false
  let markTransformStarted!: () => void
  const transformStarted = new Promise<void>((resolve) => {
    markTransformStarted = resolve
  })
  let releaseTransform!: () => void
  const transformReleased = new Promise<void>((resolve) => {
    releaseTransform = resolve
  })
  let inFlight: Promise<unknown> | undefined

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
        name: 'block-inflight-transform',
        async transform(_code, id) {
          if (id === fixture && blockTransform) {
            markTransformStarted()
            await transformReleased
          }
          return null
        },
      },
      {
        name: 'request-during-hot-update',
        async hotUpdate() {
          if (!blockTransform || inFlight) return
          inFlight = server.environments.client.transformRequest(
            '/hmr-inflight-fixture.js',
          )
          await transformStarted
        },
      },
    ],
  })
  onTestFinished(async () => {
    releaseTransform()
    await server.close()
  })

  await server.environments.client.transformRequest('/hmr-inflight-fixture.js')
  const mod = await server.environments.client.moduleGraph.getModuleByUrl(
    '/hmr-inflight-fixture.js',
  )
  expect(mod?.transformResult).not.toBeNull()

  server.environments.client.moduleGraph.onFileChange(fixture)
  blockTransform = true
  await handleHMRUpdate('update', fixture, server)
  blockTransform = false
  releaseTransform()
  await inFlight

  expect(mod?.transformResult).toBeNull()
  const result = await server.environments.client.transformRequest(
    '/hmr-inflight-fixture.js',
  )
  expect(result?.code).toContain('/hmr-inflight-fixture.js?t=')
})
