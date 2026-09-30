import { appendFile, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
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

test('reads a modified file after a chunked write has settled', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'vite-hmr-'))
  const file = path.join(directory, 'fixture.js')
  await writeFile(file, 'export const value = "partial')

  const readContents: string[] = []
  let appendStarted = false
  const server = await createServer({
    configFile: false,
    root: import.meta.dirname,
    logLevel: 'silent',
    server: { middlewareMode: true, ws: false },
    plugins: [
      {
        name: 'read-chunked-file',
        async hotUpdate({ read }) {
          const readPromise = read()
          if (!appendStarted) {
            appendStarted = true
            await new Promise((resolve) => setTimeout(resolve, 5))
            await appendFile(file, '")\n')
          }
          readContents.push(await readPromise)
        },
      },
    ],
  })
  onTestFinished(async () => {
    await server.close()
    await rm(directory, { recursive: true, force: true })
  })

  await handleHMRUpdate('update', file, server)

  expect(readContents).not.toHaveLength(0)
  for (const content of readContents) {
    expect(content).toBe('export const value = "partial")\n')
  }
})
