import { describe, expect, test } from 'vitest'
import { findAssetFile, getColor, isBuild } from '~utils'

test('should load both stylesheets', async () => {
  expect(await getColor('h1')).toBe('red')
  expect(await getColor('h2')).toBe('blue')
})

describe.runIf(isBuild)('build', () => {
  test('should generate correct files', async () => {
    expect(findAssetFile('main.*.js$')).toMatch('h2{color:#00f}h1{color:red}')
  })
})
