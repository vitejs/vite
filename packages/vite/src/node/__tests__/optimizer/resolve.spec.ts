import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { expandGlobIds } from '../../optimizer/resolve'

const fixtureRoot = path.join(import.meta.dirname, '../fixtures/glob-exports')

function makeConfig(root: string): any {
  return {
    root,
    resolve: { preserveSymlinks: false },
    packageCache: new Map(),
  }
}

describe('expandGlobIds', () => {
  test('skips null-valued exports (private subpath patterns)', () => {
    const result = expandGlobIds('my-pkg/*', makeConfig(fixtureRoot))

    expect(result).toContain('my-pkg')
    expect(result).toContain('my-pkg/utils')
    expect(result).toContain('my-pkg/public')
    expect(result).not.toContain('my-pkg/private')
    expect(result).not.toContain('my-pkg/also-private')
  })
})
