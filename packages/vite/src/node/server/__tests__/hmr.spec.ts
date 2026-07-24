import { describe, expect, test } from 'vitest'
import { isWindows } from '../../../shared/utils'
import { getShortName } from '../hmr'

describe.runIf(isWindows)('getShortName', () => {
  test('keeps files under root short when drive letter casing matches', () => {
    expect(getShortName('C:/repo/src/main.ts', 'C:/repo')).toBe('src/main.ts')
  })

  test('keeps files under root short when drive letter casing differs', () => {
    expect(getShortName('C:/repo/src/main.ts', 'c:/repo')).toBe('src/main.ts')
    expect(getShortName('c:/repo/src/main.ts', 'C:/repo')).toBe('src/main.ts')
    expect(getShortName('C:/outside/src/main.ts', 'c:/repo')).toBe(
      'C:/outside/src/main.ts',
    )
  })
})
