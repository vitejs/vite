import { describe, expect, test } from 'vitest'
import { isBuild, readFile } from '~utils'

describe.runIf(isBuild)('build', () => {
  test('ssr external regex keeps npm specifier externalized', async () => {
    const contents = readFile('dist/entry-ssr.js')
    expect(contents).toContain('npm:react@19.2.0')
  })
})
