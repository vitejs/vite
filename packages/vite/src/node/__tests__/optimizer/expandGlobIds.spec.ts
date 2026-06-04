import { describe, expect, test, vi } from 'vitest'
import { expandGlobIds } from '../../optimizer/resolve'

vi.mock('../../packages', () => ({
  resolvePackageData: vi.fn(),
}))

const { resolvePackageData } = await import('../../packages')
const mockResolvePackageData = vi.mocked(resolvePackageData)

function makeConfig(root = '/root'): any {
  return {
    root,
    resolve: { preserveSymlinks: false },
    packageCache: new Map(),
  }
}

function makePkgData(dir: string, exports: Record<string, any>) {
  return { dir, data: { exports } }
}

describe('expandGlobIds', () => {
  test('skips null-valued exports (private subpath patterns)', () => {
    mockResolvePackageData.mockReturnValue(
      makePkgData('/root/node_modules/my-pkg', {
        '.': './dist/index.js',
        './utils': './dist/utils.js',
        './private': null,
        './also-private': null,
        './public': './dist/public.js',
      }) as any,
    )

    const result = expandGlobIds('my-pkg/*', makeConfig())

    expect(result).toContain('my-pkg')
    expect(result).toContain('my-pkg/utils')
    expect(result).toContain('my-pkg/public')
    expect(result).not.toContain('my-pkg/private')
    expect(result).not.toContain('my-pkg/also-private')
  })

  test('includes non-null exports when glob matches', () => {
    mockResolvePackageData.mockReturnValue(
      makePkgData('/root/node_modules/my-pkg', {
        '.': './dist/index.js',
        './utils': './dist/utils.js',
        './helpers': './dist/helpers.js',
      }) as any,
    )

    const result = expandGlobIds('my-pkg/*', makeConfig())

    expect(result).toContain('my-pkg')
    expect(result).toContain('my-pkg/utils')
    expect(result).toContain('my-pkg/helpers')
  })
})
