import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { expandGlobIds } from '../../optimizer/resolve'

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'vite-expandGlobIds-')),
  )
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

function makeConfig(root: string): any {
  return {
    root,
    resolve: { preserveSymlinks: false },
    packageCache: new Map(),
  }
}

function writePkg(pkgName: string, exports: Record<string, any>): string {
  const pkgDir = path.join(tmpDir, 'node_modules', pkgName)
  fs.mkdirSync(pkgDir, { recursive: true })
  fs.writeFileSync(
    path.join(pkgDir, 'package.json'),
    JSON.stringify({ name: pkgName, exports }),
  )
  return pkgDir
}

describe('expandGlobIds', () => {
  test('skips null-valued exports (private subpath patterns)', () => {
    writePkg('my-pkg', {
      '.': './dist/index.js',
      './utils': './dist/utils.js',
      './private': null,
      './also-private': null,
      './public': './dist/public.js',
    })

    // create stub dist files so non-null entries resolve
    const distDir = path.join(tmpDir, 'node_modules', 'my-pkg', 'dist')
    fs.mkdirSync(distDir, { recursive: true })
    for (const f of ['index.js', 'utils.js', 'public.js']) {
      fs.writeFileSync(path.join(distDir, f), '')
    }

    const result = expandGlobIds('my-pkg/*', makeConfig(tmpDir))

    expect(result).toContain('my-pkg')
    expect(result).toContain('my-pkg/utils')
    expect(result).toContain('my-pkg/public')
    expect(result).not.toContain('my-pkg/private')
    expect(result).not.toContain('my-pkg/also-private')
  })

  test('includes non-null exports when glob matches', () => {
    writePkg('my-pkg', {
      '.': './dist/index.js',
      './utils': './dist/utils.js',
      './helpers': './dist/helpers.js',
    })

    const result = expandGlobIds('my-pkg/*', makeConfig(tmpDir))

    expect(result).toContain('my-pkg')
    expect(result).toContain('my-pkg/utils')
    expect(result).toContain('my-pkg/helpers')
  })
})
