import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { expect, test } from 'vitest'
import { isBuild, readFile, testDir } from '~utils'

const execFileAsync = promisify(execFile)

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
    new RegExp(`from ${_}@vitejs/test-resolve-pkg-exports/entry${_}`),
  )

  expect(contents).toMatch(
    new RegExp(`from ${_}@vitejs/test-deep-import/foo/index.js${_}`),
  )

  // expect(contents).toMatch(
  //   new RegExp(`from ${_}@vitejs/test-deep-import/utils/bar.js${_}`),
  // )

  expect(contents).toMatch(new RegExp(`from ${_}@vitejs/test-module-sync${_}`))

  await execFileAsync('node', [`${testDir}/dist/main.mjs`])
})

test.runIf(isBuild)(
  'node builtins should not be bundled if not used',
  async () => {
    const contents = readFile('dist/main.mjs')
    expect(contents).not.include(`node:url`)
  },
)
