import { expect, test } from 'vitest'
import { isBuild, testDir } from '~utils'

test.runIf(isBuild)('correctly resolve entrypoints', async () => {
  const { default: output } = await import(`${testDir}/dist/main.mjs`)

  expect(output).toMatchInlineSnapshot(`
    "
      Matches: 5,7
      React: 18.2.0
      Lodash: true
    "
  `)
})
