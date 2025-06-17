import { describe, expect, test, vi } from 'vitest'
import { normalizeModuleId } from '../utils'

vi.mock('../shared/utils', async (importOriginal) => {
  const mod: object = await importOriginal()
  return {
    ...mod,
    isWindows: true,
  }
})

describe('normalizeModuleId', () => {
  test('normalizes file paths', () => {
    expect(normalizeModuleId('/root/id')).toBe('/root/id')
    expect(normalizeModuleId('C:/root/id')).toBe('C:/root/id')
    expect(normalizeModuleId('C:\\root\\id')).toBe('C:/root/id')
  })

  test('removes @fs prefix', () => {
    expect(normalizeModuleId('/@fs/root/id')).toBe('/root/id')
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
