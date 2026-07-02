import { describe, expect, test } from 'vitest'
import { fileToDevUrl } from '../../plugins/asset'
import { isWindows } from '../../../shared/utils'
import type { Environment } from '../../environment'

function createEnvironment(root: string): Environment {
  return {
    getTopLevelConfig: () => ({
      root,
      publicDir: false,
      server: {},
      decodedBase: '/',
    }),
  } as unknown as Environment
}

describe.runIf(isWindows)('fileToDevUrl', () => {
  test('keeps root files relative when drive letter casing matches', async () => {
    await expect(
      fileToDevUrl(createEnvironment('C:/repo'), 'C:/repo/src/main.ts'),
    ).resolves.toBe('/src/main.ts')
  })

  test('keeps root files relative when drive letter casing differs', async () => {
    await expect(
      fileToDevUrl(createEnvironment('c:/repo'), 'C:/repo/src/main.ts'),
    ).resolves.toBe('/src/main.ts')
    await expect(
      fileToDevUrl(createEnvironment('C:/repo'), 'c:/repo/src/main.ts'),
    ).resolves.toBe('/src/main.ts')
  })

  test('keeps files outside root under /@fs/', async () => {
    await expect(
      fileToDevUrl(createEnvironment('c:/repo'), 'C:/outside/src/main.ts'),
    ).resolves.toBe('/@fs/C:/outside/src/main.ts')
  })
})
