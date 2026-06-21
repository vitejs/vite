import { describe, expect, test } from 'vitest'
import { getModuleTypeFromId } from '../transformRequest'

describe('getModuleTypeFromId', () => {
  const testCases = [
    { id: 'foo.js', expected: 'js' },
    { id: 'foo.ts', expected: 'ts' },
    { id: 'foo.a.js', expected: 'js' },
    { id: 'foo.ts?custom', expected: 'ts' },
    { id: 'foo.ts?foo=bar#hash', expected: 'ts' },
    { id: 'foo.vue?vue&type=script&lang.ts', expected: 'ts' },
    { id: 'foo.ts?custom&lang.js', expected: 'js' },
    { id: '', expected: undefined },
  ]

  for (const { id, expected } of testCases) {
    test(`should return ${expected} for id: ${id}`, () => {
      const result = getModuleTypeFromId(id)
      expect(result).toBe(expected)
    })
  }
})
