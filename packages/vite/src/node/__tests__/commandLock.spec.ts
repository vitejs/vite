import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, onTestFinished, test as baseTest, vi } from 'vitest'
import { createCommandLock } from '../commandLock'
import { resolveConfig } from '../config'
import type { InlineConfig, ResolvedConfig } from '../config'
import * as processStartTime from '../processStartTime'
import { getHash } from '../utils'

const test = baseTest.extend<{
  tempDir: string
  config: ResolvedConfig
  lockDir: string
}>({
  // eslint-disable-next-line no-empty-pattern -- Vitest requires fixture dependencies to be destructured.
  tempDir: async ({}, use) => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vite-command-lock-'))
    const spy = vi
      .spyOn(processStartTime, 'getProcessStartTime')
      .mockResolvedValue('current-start')
    try {
      await use(tempDir)
    } finally {
      spy.mockRestore()
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  },
  config: async ({ tempDir }, use) => {
    await use(await createConfig(tempDir))
  },
  lockDir: async ({ config }, use) => {
    await use(path.join(config.cacheDir, 'lock'))
  },
})

function createConfig(root: string, overrides: InlineConfig = {}) {
  return resolveConfig(
    { root, configFile: false, logLevel: 'silent', ...overrides },
    'serve',
  )
}

function writeExistingLock(
  config: ResolvedConfig,
  startTime?: string,
  pid = process.ppid,
) {
  const lockDir = path.join(config.cacheDir, 'lock')
  fs.mkdirSync(lockDir, { recursive: true })
  const lockPath = path.join(lockDir, 'existing.json')
  fs.writeFileSync(
    lockPath,
    JSON.stringify({
      command: 'build',
      root: config.root,
      configFile: config.configFile ?? null,
      mode: config.mode,
      pid,
      startTime,
      urls: null,
    }),
  )
  return lockPath
}

function readOwnLockRecord(lockDir: string) {
  for (const file of fs.readdirSync(lockDir)) {
    if (!file.endsWith('.json')) continue
    const record = JSON.parse(fs.readFileSync(path.join(lockDir, file), 'utf8'))
    if (record.pid === process.pid) return record
  }
  return undefined
}

describe('command lock', () => {
  test('writes a content-addressed record and releases it', async ({
    config,
    lockDir,
  }) => {
    const urls = {
      local: ['http://localhost:4173/'],
      network: ['http://192.168.1.10:4173/'],
    }
    const lock = await createCommandLock(config, 'preview', urls)
    onTestFinished(() => lock.release())

    await vi.waitFor(() => {
      expect(fs.readdirSync(lockDir)).toHaveLength(1)
      expect(readOwnLockRecord(lockDir)?.startTime).toBe('current-start')
    })

    const files = fs.readdirSync(lockDir)
    const content = fs.readFileSync(path.join(lockDir, files[0]), 'utf8')
    expect(files[0]).toBe(`${getHash(content, 16)}.json`)
    expect(JSON.parse(content)).toStrictEqual({
      command: 'preview',
      root: config.root,
      configFile: null,
      mode: 'development',
      pid: process.pid,
      startTime: 'current-start',
      urls,
    })

    lock.release()
    expect(fs.readdirSync(lockDir)).toStrictEqual([])
  })

  test('publishes without waiting for the start time and republishes once known', async ({
    config,
    lockDir,
  }) => {
    let resolveStartTime!: (startTime: string | undefined) => void
    vi.mocked(processStartTime.getProcessStartTime).mockImplementation(
      () =>
        new Promise<string | undefined>((resolve) => {
          resolveStartTime = resolve
        }),
    )
    const lock = await createCommandLock(config, 'build', null)
    onTestFinished(() => lock.release())

    expect(fs.readdirSync(lockDir)).toHaveLength(1)
    expect(readOwnLockRecord(lockDir)?.startTime).toBeUndefined()

    resolveStartTime('late-start')
    await vi.waitFor(() => {
      expect(fs.readdirSync(lockDir)).toHaveLength(1)
      expect(readOwnLockRecord(lockDir)?.startTime).toBe('late-start')
    })
  })

  test('ignores malformed records', async ({ config, lockDir }) => {
    fs.mkdirSync(lockDir, { recursive: true })
    fs.writeFileSync(path.join(lockDir, 'malformed.json'), '{')

    const lock = await createCommandLock(config, 'build', null)
    onTestFinished(() => lock.release())

    await vi.waitFor(() => {
      expect(readOwnLockRecord(lockDir)?.startTime).toBe('current-start')
    })
    const files = fs.readdirSync(lockDir)
    expect(files).toHaveLength(2)
    expect(files).toContain('malformed.json')
  })

  test('continues when the lock directory cannot be created', async ({
    tempDir,
  }) => {
    const cacheDir = path.join(tempDir, 'cache-file')
    fs.writeFileSync(cacheDir, '')
    const lock = await createCommandLock(
      await createConfig(tempDir, { cacheDir }),
      'build',
      null,
    )
    onTestFinished(() => lock.release())
    expect(fs.existsSync(path.join(cacheDir, 'lock'))).toBe(false)
  })

  for (const startTime of ['current-start', 'previous-start', undefined]) {
    test(`handles the current PID with recorded start time ${startTime}`, async ({
      config,
    }) => {
      const lockPath = writeExistingLock(config, startTime, process.pid)
      const lock = await createCommandLock(config, 'build', null)
      onTestFinished(() => lock.release())
      expect(fs.existsSync(lockPath)).toBe(startTime !== 'previous-start')
      expect(
        processStartTime.getProcessStartTime,
      ).toHaveBeenCalledExactlyOnceWith(process.pid)
    })
  }

  for (const actualStartTime of ['recorded-start', 'reused-start', undefined]) {
    test(`validates another live PID with actual start time ${actualStartTime}`, async ({
      config,
    }) => {
      vi.mocked(processStartTime.getProcessStartTime).mockImplementation(
        async (pid) =>
          pid === process.pid ? 'current-start' : actualStartTime,
      )
      const lockPath = writeExistingLock(config, 'recorded-start')
      const result = createCommandLock(config, 'build', null)
      if (actualStartTime === 'reused-start') {
        const lock = await result
        onTestFinished(() => lock.release())
        expect(fs.existsSync(lockPath)).toBe(false)
      } else {
        await expect(result).rejects.toThrow('Found another Vite build process')
        expect(fs.existsSync(lockPath)).toBe(true)
      }
      expect(processStartTime.getProcessStartTime).toHaveBeenCalledWith(
        process.ppid,
      )
    })
  }

  test('checks a live PID without a recorded start time using liveness alone', async ({
    config,
  }) => {
    writeExistingLock(config)
    await expect(createCommandLock(config, 'build', null)).rejects.toThrow(
      'Found another Vite build process',
    )
    // The duplicate check exits before any start time is read.
    expect(processStartTime.getProcessStartTime).not.toHaveBeenCalled()
  })

  test('publishes a lock when the current start time cannot be read', async ({
    config,
    lockDir,
  }) => {
    vi.mocked(processStartTime.getProcessStartTime).mockResolvedValue(undefined)
    const lock = await createCommandLock(config, 'build', null)
    onTestFinished(() => lock.release())
    const files = fs.readdirSync(lockDir)
    expect(files).toHaveLength(1)
    const record = JSON.parse(
      fs.readFileSync(path.join(lockDir, files[0]), 'utf8'),
    )
    expect(record.pid).toBe(process.pid)
    expect(record.startTime).toBeUndefined()
  })

  test('checks for duplicates when the current start time cannot be read', async ({
    config,
  }) => {
    vi.mocked(processStartTime.getProcessStartTime).mockResolvedValue(undefined)
    writeExistingLock(config)
    await expect(createCommandLock(config, 'build', null)).rejects.toThrow(
      'Found another Vite build process',
    )
  })
})
