import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeEach, describe, expect, onTestFinished, test } from 'vitest'
import { createCommandLock } from '../commandLock'
import { resolveConfig } from '../config'
import type { InlineConfig } from '../config'
import { createLogger } from '../logger'
import { getHash } from '../utils'

describe('command lock', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vite-command-lock-'))
    return () => {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  function createConfig(overrides: InlineConfig = {}) {
    return resolveConfig(
      {
        root: tempDir,
        cacheDir: path.join(tempDir, 'node_modules/.vite'),
        configFile: false,
        mode: 'development',
        customLogger: createLogger('silent'),
        ...overrides,
      },
      'build',
    )
  }

  test('writes a content-addressed record and releases it', async () => {
    const config = await createConfig()
    const lock = await createCommandLock(config, 'preview', {
      local: ['http://localhost:4173/'],
      network: ['http://192.168.1.10:4173/'],
    })
    onTestFinished(() => lock.release())

    const lockDir = path.join(config.cacheDir, 'lock')
    const files = fs.readdirSync(lockDir)
    expect(files).toHaveLength(1)

    const content = fs.readFileSync(path.join(lockDir, files[0]), 'utf8')
    expect(files[0]).toBe(`${getHash(content, 16)}.json`)
    expect(JSON.parse(content)).toStrictEqual({
      command: 'preview',
      root: config.root,
      configFile: null,
      mode: 'development',
      pid: process.pid,
      urls: {
        local: ['http://localhost:4173/'],
        network: ['http://192.168.1.10:4173/'],
      },
    })

    lock.release()
    expect(fs.readdirSync(lockDir)).toStrictEqual([])
  })

  test('ignores malformed records', async () => {
    const config = await createConfig()
    const lockDir = path.join(config.cacheDir, 'lock')
    fs.mkdirSync(lockDir, { recursive: true })
    fs.writeFileSync(path.join(lockDir, 'malformed.json'), '{')

    const lock = await createCommandLock(config, 'build', null)
    onTestFinished(() => lock.release())

    const files = fs.readdirSync(lockDir)
    expect(files).toHaveLength(2)
    expect(files).toContain('malformed.json')
  })

  test('continues when the lock directory cannot be created', async () => {
    const cacheDir = path.join(tempDir, 'cache-file')
    fs.writeFileSync(cacheDir, '')
    const config = await createConfig({ cacheDir })

    const lock = await createCommandLock(config, 'build', null)
    onTestFinished(() => lock.release())
    expect(lock).toBeDefined()
    expect(fs.existsSync(path.join(cacheDir, 'lock'))).toBe(false)
  })
})
