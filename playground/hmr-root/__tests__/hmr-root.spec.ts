import { expect, test } from 'vitest'

import { editFile, isServe, page, withPageReload } from '~utils'

test.runIf(isServe)('should watch files outside root', async () => {
  expect(await page.textContent('#foo')).toBe('foo')
  await withPageReload(() =>
    editFile('foo.js', (code) => code.replace("'foo'", "'foobar'")),
  )
  expect(await page.textContent('#foo')).toBe('foobar')
})
