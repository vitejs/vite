import fs from 'node:fs'
import path from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { execaCommand } from 'execa'
import { expect, onTestFinished, test } from 'vitest'
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

function startViteProcess(args = '') {
  return execaCommand(`${viteBinPath} ${args}`, {
    cwd: rootDir,
    stdio: 'pipe',
    forceKillAfterDelay: 3000,
  })
}

function captureStdout(subprocess: ReturnType<typeof startViteProcess>) {
  let output = ''
  subprocess.stdout.on('data', (data) => {
    output += stripVTControlCharacters(data.toString())
  })
  return () => output
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
        readCommandLockRecords().some((record) => record.command === 'build'),
      { interval: 10 },
    )
    .toBe(true)

  await buildProcess
  expect(
    readCommandLockRecords().some((record) => record.command === 'build'),
  ).toBe(false)
})

test('preview reports a missing build directory', async () => {
  const result = await execaCommand(
    `${viteBinPath} preview --outDir missing-command-lock --mode missing-build`,
    { cwd: rootDir, reject: false },
  )
  expect(result.exitCode).toBe(1)
  expect(result.stderr).toContain(
    'The directory "missing-command-lock" does not exist. Did you build your project?',
  )
})

test.runIf(!isWindows)(
  'exits when another Vite process owns the port',
  async () => {
    const command = isServe ? 'dev' : 'preview'
    const serverProcess = execaCommand(
      `${viteBinPath} ${command} --port ${port} --strict-port`,
      { cwd: rootDir },
    )
    try {
      const result = await serverProcess.catch((error) => error)
      expect(result.exitCode).toBe(1)
      const output = stripVTControlCharacters(result.stderr)
      expect(output).toMatch(
        new RegExp(`Found another Vite ${command} process.*\\(PID \\d+\\)`),
      )
    } finally {
      await killProcess(serverProcess)
      await serverProcess.catch(() => {})
    }
  },
)

test.runIf(isServe && !isWindows)(
  'exits when another build is running',
  async () => {
    const buildProcess = startViteProcess(
      'build --watch --outDir dist-command-lock',
    )
    onTestFinished(async () => {
      await killProcess(buildProcess)
      await buildProcess.catch(() => {})
    })
    const getOutput = captureStdout(buildProcess)
    await expect.poll(getOutput).toMatch(/built in \d+ms/)

    const result = await execaCommand(
      `${viteBinPath} build --outDir dist-command-lock`,
      { cwd: rootDir, reject: false },
    )
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain(
      `Found another Vite build process for this project (PID ${buildProcess.pid})`,
    )
  },
)

for (const command of isServe ? ['dev', 'build'] : ['preview']) {
  test.runIf(!isWindows)(
    `${command} disables process locks with --bypass-lock`,
    async () => {
      const args =
        command === 'build'
          ? 'build --watch --outDir dist-bypass-lock'
          : `${command} --host 127.0.0.1 --port 0 --strict-port`
      const ready =
        command === 'build' ? /built in \d+ms/ : /http:\/\/127\.0\.0\.1:\d+\//
      const originalFiles = new Set(fs.readdirSync(lockDir()))
      const ownerProcess = startViteProcess(`${args} --mode bypass-lock`)
      onTestFinished(async () => {
        if (ownerProcess.exitCode == null && ownerProcess.signalCode == null) {
          ownerProcess.kill('SIGKILL')
        }
        await ownerProcess.catch(() => {})
        for (const file of fs.readdirSync(lockDir())) {
          if (!originalFiles.has(file)) {
            fs.rmSync(path.join(lockDir(), file), { force: true })
          }
        }
      })
      const getOwnerOutput = captureStdout(ownerProcess)
      await expect.poll(getOwnerOutput).toMatch(ready)
      if (command !== 'build') {
        await expect
          .poll(() =>
            readCommandLockRecords().filter(
              (record) => record.pid === ownerProcess.pid,
            ),
          )
          .toMatchObject([{ urls: { local: [expect.stringMatching(ready)] } }])
      }
      const existingRecords = readCommandLockRecords()

      for (const ownerState of ['running', 'terminated']) {
        if (ownerState === 'terminated') {
          ownerProcess.kill('SIGKILL')
          await ownerProcess.catch(() => {})
        }
        const serverProcess = startViteProcess(
          `${args} --mode bypass-lock --bypass-lock`,
        )
        const getOutput = captureStdout(serverProcess)

        try {
          await expect.poll(getOutput).toMatch(ready)
          expect(readCommandLockRecords()).toStrictEqual(existingRecords)
        } finally {
          await killProcess(serverProcess)
          await serverProcess.catch(() => {})
        }
      }
    },
  )
}

test.runIf(isServe && !isWindows)(
  'removes a command record left by a terminated Vite process',
  async () => {
    const args = '--host 127.0.0.1 --port 0 --strict-port --mode stale-lock'
    const staleProcess = startViteProcess(args)
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

      replacementProcess = startViteProcess(args)
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
        .toStrictEqual({ replacement: true, stale: false })
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
