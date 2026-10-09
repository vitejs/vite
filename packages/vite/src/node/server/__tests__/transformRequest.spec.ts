import { describe, expect, test } from 'vitest'
import { getModuleTypeFromId } from '../transformRequest'

describe('getModuleTypeFromId', () => {
  const testCases = [
    { id: 'foo.js', expected: 'js' },
    { id: 'foo.ts', expected: 'ts' },
    { id: 'foo.a.js', expected: 'js' },
    { id: '', expected: undefined },
    {
      id: '/example?lang=.label',
      expected: undefined,
      moduleTypes: { '.label': 'text' },
    },
    { id: '/index.html?html-proxy&index=0.css', expected: 'css' },
    { id: 'entry.css?html-proxy&index=0.css', expected: 'css' },
    { id: 'foo.js?worker', expected: 'js' },
    { id: 'foo.css?inline', expected: 'css' },
    {
      id: 'foo.js?lang=.label',
      expected: 'js',
      moduleTypes: { '.label': 'text' },
    },
    {
      id: 'foo.label?lang=.js',
      expected: 'text',
      moduleTypes: { '.label': 'text' },
    },
    {
      id: 'foo.label?raw',
      expected: 'text',
      moduleTypes: { '.label': 'text' },
    },
    { id: 'foo.label', expected: 'text', moduleTypes: { '.label': 'text' } },
    {
      id: 'foo.jsonlabel',
      expected: 'json',
      moduleTypes: { '.jsonlabel': 'json' },
    },
  ]

  for (const { id, expected, moduleTypes } of testCases) {
    test(`should return ${expected} for id: ${id}`, () => {
      const result = getModuleTypeFromId(
        id,
        moduleTypes as Record<string, string>,
      )
      expect(result).toBe(expected)
    })
  }
})
