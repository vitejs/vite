import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { expect, onTestFinished, test } from 'vitest'
import { normalizePath } from '../../utils'
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

test('removes orphaned file-only entries from the module graph', async () => {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'vite-css-watch-')),
  )
  const cssFile = normalizePath(path.join(root, 'style.css'))
  const probeFile = normalizePath(path.join(root, 'probe.js'))
  const otherFile = normalizePath(path.join(root, 'other.js'))
  await fs.writeFile(cssFile, '.foo { color: red; }')
  await fs.writeFile(probeFile, 'export default true')
  const watchedFiles = new Set([probeFile])

  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'silent',
    server: { middlewareMode: true, ws: false },
    plugins: [
      {
        name: 'css-watch-files',
        transform(_code, id) {
          if (id === cssFile) {
            for (const file of watchedFiles) {
              this.addWatchFile(file)
            }
          }
        },
      },
    ],
  })
  onTestFinished(async () => {
    await server.close()
    await fs.rm(root, { recursive: true, force: true })
  })

  await server.environments.client.transformRequest('/style.css')
  const moduleGraph = server.environments.client.moduleGraph
  const fileOnlyModule = [
    ...(moduleGraph.getModulesByFile(probeFile) ?? []),
  ].find((mod) => mod.type === 'asset' && mod.id == null)!
  expect(fileOnlyModule.importers.size).toBe(1)

  watchedFiles.clear()
  watchedFiles.add(otherFile)
  moduleGraph.invalidateModule(moduleGraph.getModuleById(cssFile)!)
  await server.environments.client.transformRequest('/style.css')

  expect(fileOnlyModule.importers.size).toBe(0)
  expect([...(moduleGraph.getModulesByFile(probeFile) ?? [])]).not.toContain(
    fileOnlyModule,
  )
})
