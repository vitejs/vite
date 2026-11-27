import fs from 'node:fs'
import os from 'node:os'
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

test('does not cache a transform started during hotUpdate hooks with a pre-update timestamp (fix #24142)', async () => {
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms))

  // Work on a copy so the repo stays clean, like the reporter's repro.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vite-hmr-inflight-'))
  fs.writeFileSync(
    path.join(root, 'a.js'),
    `// a.js imports itself, as every module does under @vitejs/plugin-react's Fast Refresh
import * as self from '/a.js'
import { b } from './b.js'

export const a = 1

import.meta.hot?.accept()
`,
  )
  fs.writeFileSync(path.join(root, 'b.js'), `export const b = 1\n`)

  let saved = false
  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'silent',
    server: {
      middlewareMode: true,
      ws: false,
    },
    plugins: [
      {
        // Makes the transform of a.js slow: resolving './b.js' takes 300 ms.
        name: 'slow-resolve',
        enforce: 'pre',
        async resolveId(id) {
          if (saved && id === './b.js') await sleep(300)
        },
      },
      {
        // Requests a.js while the HMR update is running,
        // as a browser tab or another plugin can.
        name: 'request-during-update',
        async hotUpdate() {
          if (saved) {
            void server.environments.client.transformRequest('/a.js')
            await sleep(20)
          }
        },
      },
    ],
  })
  onTestFinished(async () => {
    await server.close()
    fs.rmSync(root, { recursive: true })
  })

  const client = server.environments.client

  // 1. Load a.js once.
  await client.transformRequest('/a.js')

  // 2. Save a.js, and wait for the update and the slow transform to finish.
  saved = true
  const file = path.join(root, 'a.js')
  const source = fs.readFileSync(file, 'utf8')
  fs.writeFileSync(
    file,
    source.replace('export const a = 1', 'export const a = 2'),
  )
  // Mirror the watcher flow: invalidate the module graph before the HMR update.
  client.moduleGraph.onFileChange(file)
  await handleHMRUpdate('update', file, server)
  await sleep(1000)

  // 3. Fetch a.js the way the browser does after the update.
  const mod = await client.moduleGraph.getModuleByUrl('/a.js')
  const url = `/a.js?t=${mod!.lastHMRTimestamp}`
  const { code } = (await client.transformRequest(url))!
  const selfImport = code.match(/as self from ["']([^"']+)/)![1]

  expect(selfImport).toBe(url)
})
