import { describe, expect, test, vi } from 'vitest'
import { normalizeModuleId } from '../utils'

describe('normalizeModuleId', () => {
  test('normalizes file paths', () => {
    expect(normalizeModuleId('/root/id')).toBe('/root/id')
    expect(normalizeModuleId('C:/root/id')).toBe('C:/root/id')
    expect(normalizeModuleId('C:\\root\\id')).toBe('C:/root/id')
  })

  /**
   * Because test are running with isolate: false these test and stubGlobal are causing "spooky action at a distance” failing other random tests.
   */
  test.skip('removes @fs prefix on windows', async () => {
    vi.stubGlobal('process', {
      ...globalThis.process,
      platform: 'win32',
    })
    vi.resetModules()
    const normalize = await import('../utils').then((m) => m.normalizeModuleId)
    expect(normalize('/@fs/root/id')).toBe('root/id')

    vi.unstubAllGlobals()
  })

  test.skip('removes @fs prefix on linux', async () => {
    vi.stubGlobal('process', {
      ...globalThis.process,
      platform: 'linux',
    })
    vi.resetModules()
    const normalize = await import('../utils').then((m) => m.normalizeModuleId)
    expect(normalize('/@fs/D:\\a\\fixtures\\c.ts')).toBe('D:/a/fixtures/c.ts')

    vi.unstubAllGlobals()
  })

  test('preserves virtual module IDs', () => {
    expect(normalizeModuleId('virtual:custom')).toBe('virtual:custom')
  })

  test('removes node: prefix', () => {
    expect(normalizeModuleId('node:fs')).toBe('fs')
    expect(normalizeModuleId('node:path')).toBe('path')
  })

  test('removes file: protocol', () => {
    expect(normalizeModuleId('file:/root/id')).toBe('/root/id')
    expect(normalizeModuleId('file:///root/id.js')).toBe('/root/id.js')
  })

  test('normalizes multiple leading slashes', () => {
    expect(normalizeModuleId('//root/id')).toBe('/root/id')
    expect(normalizeModuleId('///root/id')).toBe('/root/id')
  })

  test('preserves prefixed builtins', () => {
    const prefixedBuiltins = [
      'node:sea',
      'node:sqlite',
      'node:test',
      'node:test/reporters',
    ]
    for (const builtin of prefixedBuiltins) {
      expect(normalizeModuleId(builtin)).toBe(builtin)
    }
  })
})
