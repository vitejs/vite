import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'
import { isBuild, readFile, testDir } from '~utils'

test.runIf(isBuild)('tree shake json', () => {
  const assetsDir = path.resolve(testDir, 'dist/assets')
  const files = fs.readdirSync(assetsDir)

  const jsFile = files.find((f) => f.endsWith('.js'))
  const jsContent = readFile(path.resolve(assetsDir, jsFile))

  expect(jsContent).not.toContain('DEV_ONLY_JSON')
})
