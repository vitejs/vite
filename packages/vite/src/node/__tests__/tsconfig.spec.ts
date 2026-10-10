import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { resolveTsconfig } from '../tsconfig'

const fixtureDir = path.resolve(
  fileURLToPath(import.meta.url),
  '../plugins/fixtures/oxc-tsconfigs',
)

describe('resolveTsconfig', () => {
  test('resolves the nearest tsconfig for a file', () => {
    const result = resolveTsconfig(
      path.join(fixtureDir, 'target-es2022', 'index.ts'),
    )
    expect(result).not.toBeNull()
    expect(result!.tsconfig.compilerOptions?.target).toBe('es2022')
    expect(
      result!.tsconfigFilePaths.some((p) => p.endsWith('tsconfig.json')),
    ).toBe(true)
  })

  test('returns null when no tsconfig is found', () => {
    const root = path.parse(process.cwd()).root
    expect(resolveTsconfig(path.join(root, 'vite-no-tsconfig', 'a.ts'))).toBe(
      null,
    )
  })
})
