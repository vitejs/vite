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

test('does not cache a transform started while hotUpdate hooks run', async () => {
  const fixture = path.join(import.meta.dirname, 'hmr-inflight-fixture.js')
  let inFlight: Promise<unknown> | undefined
  let hookRan = false
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
        name: 'slow-transform',
        async transform(_code, id) {
          if (id === fixture && inFlight) {
            // keep the in-flight transform running while the
            // invalidation happens
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
          return null
        },
      },
      {
        name: 'request-during-hot-update',
        async hotUpdate() {
          if (hookRan) return
          hookRan = true
          // wait past the timestamp taken before the hooks ran, then
          // start a transform request, like a browser or plugin
          // requesting the module mid-update
          await new Promise((resolve) => setTimeout(resolve, 5))
          inFlight = client().transformRequest('/hmr-inflight-fixture.js')
          await new Promise((resolve) => setTimeout(resolve, 10))
        },
      },
    ],
  })
  onTestFinished(async () => {
    await server.close()
  })
  const client = () => server.environments.client

  // warm up: populate the module graph and its transform result
  await client().transformRequest('/hmr-inflight-fixture.js')
  const mod = await client().moduleGraph.getModuleByUrl(
    '/hmr-inflight-fixture.js',
  )
  expect(mod?.transformResult).not.toBeNull()

  // what the file watcher does on change, before handleHotUpdate runs:
  // drop the cached result so a request during the hooks really transforms
  client().moduleGraph.onFileChange(fixture)

  await handleHMRUpdate('update', fixture, server)
  // the in-flight transform finished after the invalidation, so its
  // result (built with pre-update import URLs) must be discarded
  await inFlight
  expect(mod?.transformResult).toBeNull()

  // a fresh request re-transforms the module with the new timestamp
  const result = await client().transformRequest('/hmr-inflight-fixture.js')
  expect(result?.code).toContain('/hmr-inflight-fixture.js?t=')
})
