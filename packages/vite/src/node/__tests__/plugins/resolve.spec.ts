import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { resolveSubpathImports } from '../../plugins/resolve'

const fixtureDir = path.resolve(
  import.meta.dirname,
  '../fixtures/subpath-imports',
)
const importer = path.join(fixtureDir, 'main.js')

const resolve = (id: string) =>
  resolveSubpathImports(id, importer, {
    packageCache: new Map(),
    conditions: [],
    externalConditions: [],
    isProduction: false,
    isRequire: false,
  })

describe('resolveSubpathImports', () => {
  test('resolves a "#/*" pattern', () => {
    expect(resolve('#/foo.js')).toBe('./root-slash/foo.js')
  })

  test('resolves a "##/*" pattern', () => {
    expect(resolve('##/foo.js')).toBe('./double-hash/foo.js')
  })

  test('keeps the query and hash after a "##/*" pattern', () => {
    expect(resolve('##/foo.js?raw#frag')).toBe('./double-hash/foo.js?raw#frag')
  })

  test('keeps the query after an exact match', () => {
    expect(resolve('#query?url')).toBe('./query.json?url')
  })
})
