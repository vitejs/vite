import path from 'node:path'
import { describe, expect, test } from 'vitest'
import type { Environment } from '../../environment'
import {
  createIsOptimizedDepFile,
  createIsOptimizedDepUrl,
} from '../../optimizer'
import { normalizePath, removeLeadingSlash } from '../../utils'

const root = normalizePath(path.resolve(import.meta.dirname, '/project'))
const cacheDir = normalizePath(path.resolve(import.meta.dirname, '/cache'))
const environment = {
  name: 'client',
  config: { root, cacheDir },
} as Environment
const cacheDirNames = [
  'deps',
  'deps_ssr',
  'deps_ssr_worker',
  'deps_temp_123',
  'deps-extra',
]

describe('createIsOptimizedDepFile', () => {
  const isFile = createIsOptimizedDepFile(environment)

  for (const dir of cacheDirNames) {
    test(`classifies files in ${dir}`, () => {
      expect(isFile(`${cacheDir}/${dir}/dep.js?v=abc`)).toBe(dir === 'deps')
    })
  }
})

describe('createIsOptimizedDepUrl', () => {
  const isUrl = createIsOptimizedDepUrl(environment)

  for (const dir of cacheDirNames) {
    test(`classifies URLs in ${dir}`, () => {
      expect(
        isUrl(`/@fs/${removeLeadingSlash(cacheDir)}/${dir}/dep.js.map`),
      ).toBe(dir === 'deps')
    })
  }

  test('matches root-relative URLs when the cache is inside root', () => {
    const isUrlInsideRoot = createIsOptimizedDepUrl({
      name: 'client',
      config: { root, cacheDir: `${root}/cache` },
    } as Environment)

    expect(isUrlInsideRoot('/cache/deps/dep.js')).toBe(true)
    expect(isUrlInsideRoot('/cache/deps_other/dep.js')).toBe(false)
  })
})
