import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { ResolvedConfig } from '../config'
import { initPublicFiles } from '../publicDir'

describe('initPublicFiles', () => {
  const dirsToClean: string[] = []

  afterEach(() => {
    while (dirsToClean.length) {
      fs.rmSync(dirsToClean.pop()!, { recursive: true, force: true })
    }
  })

  function makeTempDir() {
    const dir = fs.mkdtempSync(
      path.join(fs.realpathSync(os.tmpdir()), 'vite-public-dir-test-'),
    )
    dirsToClean.push(dir)
    return dir
  }

  it('returns undefined when the configured public dir does not exist (#19864)', async () => {
    const publicDir = path.join(makeTempDir(), 'does-not-exist')

    const result = await initPublicFiles({ publicDir } as ResolvedConfig)

    expect(result).toBeUndefined()
  })

  it('returns the set of files when the public dir exists', async () => {
    const publicDir = makeTempDir()
    fs.writeFileSync(path.join(publicDir, 'foo.txt'), '')

    const result = await initPublicFiles({ publicDir } as ResolvedConfig)

    expect(result).toEqual(new Set(['/foo.txt']))
  })

  it('returns an empty set when the public dir exists but is empty', async () => {
    const publicDir = makeTempDir()

    const result = await initPublicFiles({ publicDir } as ResolvedConfig)

    expect(result).toEqual(new Set())
  })
})
