import { expect, test } from 'vitest'

import { editFile, isServe, page, untilUpdated } from '~utils'

test.runIf(isServe)('should watch files outside root', async () => {
  expect(await page.textContent('#foo')).toBe('foo')
  editFile('foo.js', (code) => code.replace("'foo'", "'foobar'"))
  await page.waitForEvent('load')
  await untilUpdated(async () => await page.textContent('#foo'), 'foobar')
})
