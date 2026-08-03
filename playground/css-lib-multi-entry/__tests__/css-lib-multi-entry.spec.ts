import { describe, expect, test } from 'vitest'
import { isBuild, readFile } from '~utils'

describe.runIf(isBuild)('build', () => {
  test('does not crash and bundles CSS from both entries together', () => {
    const css = readFile('dist/test-css-lib-multi-entry.css')
    expect(css).toMatch('.linked')
    expect(css).toMatch('.style-only')
  })

  test('JS entry output is unaffected', () => {
    const es = readFile('dist/index.js')
    const cjs = readFile('dist/index.cjs')
    expect(es).toMatch('hello')
    expect(cjs).toMatch('hello')
  })

  test('CSS-only entry does not leave a JS placeholder chunk', () => {
    expect(() => readFile('dist/style-only.js')).toThrow()
    expect(() => readFile('dist/style-only.cjs')).toThrow()
  })
})
