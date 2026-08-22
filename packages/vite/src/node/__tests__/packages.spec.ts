import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { describe, expect, test } from 'vitest'
import { resolvePackageData } from '../packages'

describe('resolvePackageData', () => {
  test('supports symlinked packages without package.json (Yarn 2 link protocol)', () => {
    const tmpDir = os.tmpdir()
    const root = fs.mkdtempSync(path.join(tmpDir, 'vite-test-packages-'))
    const sourceDir = path.join(root, 'linked-source')
    const testDir = path.join(root, 'repro-link-test')
    const nodeModules = path.join(testDir, 'node_modules')
    const pkgLink = path.join(nodeModules, 'my-link')

    try {
      fs.mkdirSync(sourceDir)
      fs.mkdirSync(testDir)
      fs.mkdirSync(nodeModules)

      // Create symlink
      fs.symlinkSync(sourceDir, pkgLink, 'dir')

      const pkgData = resolvePackageData('my-link', testDir)

      expect(pkgData).not.toBeNull()

      // Compare inodes to be robust against Windows short/long path name aliases (e.g. RUNNER~1 vs runneradmin)
      const stat1 = fs.statSync(pkgData!.dir)
      const stat2 = fs.statSync(sourceDir)
      expect(stat1.ino).toBe(stat2.ino)
      expect(stat1.dev).toBe(stat2.dev)
    } finally {
      try {
        fs.rmSync(root, { recursive: true, force: true })
      } catch {}
    }
  })
})
