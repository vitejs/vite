import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { isBuild, testDir } from '~utils'

describe.runIf(isBuild)('build', () => {
  // assert correct files
  test('inlined code generation', async () => {
    const assetsDir = path.resolve(testDir, 'dist/inline-url/assets')
    const files = fs.readdirSync(assetsDir)
    const index = files.find((f) => f.includes('main-module'))
    const content = fs.readFileSync(path.resolve(assetsDir, index), 'utf-8')

    // inlined
    expect(content).toMatch(
      `return new Worker("data:application/javascript;base64,"+`,
    )
  })
})
