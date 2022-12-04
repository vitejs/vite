import { expect, test } from 'vitest'
import { isBuild, readFile, testDir } from '~utils'

test.runIf(isBuild)('correctly resolve entrypoints', async () => {
  const contents = readFile('dist/main.mjs')

  const _ = `['"]`
  expect(contents).toMatch(
    new RegExp(`from ${_}@vitejs/test-entries/dir/index.js${_}`),
  )
  expect(contents).toMatch(
    new RegExp(`from ${_}@vitejs/test-entries/file.js${_}`),
  )
  expect(contents).toMatch(
    new RegExp(`from ${_}@vitejs/test-pkg-exports/entry${_}`),
  )

  await expect(import(`${testDir}/dist/main.mjs`)).resolves.toBeTruthy()
})
