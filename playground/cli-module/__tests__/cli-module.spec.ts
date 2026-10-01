import fs from 'node:fs'
import path from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { execaCommand } from 'execa'
import { expect, test } from 'vitest'
import {
  isServe,
  isWindows,
  killProcess,
  page,
  rootDir,
  viteBinPath,
} from '~utils'
import { port } from './serve'

const lockDir = () => path.join(rootDir, 'node_modules/.vite/lock')

function readCommandLockRecords() {
  const files = fs.readdirSync(lockDir())
  return files
    .filter((file) => file.endsWith('.json'))
    .map((file) =>
      JSON.parse(fs.readFileSync(path.join(lockDir(), file), 'utf8')),
    )
}

function startViteProcess() {
  return execaCommand(
    `${viteBinPath} --host 127.0.0.1 --port 0 --strict-port`,
    {
      cwd: rootDir,
      stdio: 'pipe',
      forceKillAfterDelay: 3000,
    },
  )
}

test('cli should work in "type":"module" package', async () => {
  // this test uses a custom serve implementation, so regular helpers for browserLogs and goto don't work
  // do the same thing manually
  const logs = []
  const onConsole = (msg) => {
    logs.push(msg.text())
  }
  try {
    page.on('console', onConsole)
    await page.goto(`http://localhost:${port}/`)
    expect(await page.textContent('.app')).toBe(
      'vite cli in "type":"module" package works!',
    )
    expect(
      logs.some((msg) =>
        msg.match('vite cli in "type":"module" package works!'),
      ),
    ).toBe(true)
  } finally {
    page.off('console', onConsole)
  }
})

test.runIf(isServe)('removes the command record on process exit', async () => {
  const buildProcess = execaCommand(
    `${viteBinPath} build --outDir dist-command-lock`,
    { cwd: rootDir },
  )

  await expect
    .poll(
      () =>
        readCommandLockRecords().some(
          (record) => record.pid === buildProcess.pid,
        ),
      { interval: 10 },
    )
    .toBe(true)

  await buildProcess
  expect(
    readCommandLockRecords().some((record) => record.pid === buildProcess.pid),
  ).toBe(false)
})

test.runIf(isServe && !isWindows)(
  'reports another running Vite process',
  async () => {
    const serverProcess = startViteProcess()
    let output = ''
    serverProcess.stdout.on('data', (data) => {
      output += stripVTControlCharacters(data.toString())
    })

    try {
      await expect
        .poll(() => output)
        .toMatch(/Found another Vite dev process.*\(PID \d+\)/)

      await expect
        .poll(() => {
          const records = readCommandLockRecords()
          return records.find((record) => record.pid === serverProcess.pid)
        })
        .toMatchObject({
          command: 'dev',
          urls: {
            local: [expect.stringMatching(/^http:\/\/127\.0\.0\.1:\d+\/$/)],
            network: [],
          },
        })
    } finally {
      await killProcess(serverProcess)
      await serverProcess.catch(() => {})
    }

    await expect
      .poll(() => {
        const records = readCommandLockRecords()
        return records.some((record) => record.pid === serverProcess.pid)
      })
      .toBe(false)
  },
)

test.runIf(isServe && !isWindows)(
  'removes a command record left by a terminated Vite process',
  async () => {
    const staleProcess = startViteProcess()
    let replacementProcess: ReturnType<typeof startViteProcess> | undefined
    try {
      await expect
        .poll(() => {
          const records = readCommandLockRecords()
          return records.some((record) => record.pid === staleProcess.pid)
        })
        .toBe(true)

      staleProcess.kill('SIGKILL')
      await staleProcess.catch(() => {})
      expect(
        readCommandLockRecords().some(
          (record) => record.pid === staleProcess.pid,
        ),
      ).toBe(true)

      replacementProcess = startViteProcess()
      await expect
        .poll(() => {
          const records = readCommandLockRecords()
          return {
            replacement: records.some(
              (record) => record.pid === replacementProcess?.pid,
            ),
            stale: records.some((record) => record.pid === staleProcess.pid),
          }
        })
        .toEqual({ replacement: true, stale: false })
    } finally {
      if (staleProcess.exitCode == null && staleProcess.signalCode == null) {
        staleProcess.kill('SIGKILL')
        await staleProcess.catch(() => {})
      }
      if (replacementProcess) {
        await killProcess(replacementProcess)
        await replacementProcess.catch(() => {})
      }
    }
  },
)
