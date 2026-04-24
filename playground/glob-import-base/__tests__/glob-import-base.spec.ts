import { expect, test } from 'vitest'
import { page } from '~utils'

// Regression test for https://github.com/rolldown/rolldown/issues/9144:
// `import.meta.glob` with `base: '/'` matching files outside of vite's root
// must still build and resolve correctly. The plugin must emit a
// root-relative import path (prefixed with `/`) so the bundler does not
// resolve it against the importer and land on a non-existent file.
test('absolute base with files outside of root', async () => {
  await expect
    .poll(async () => JSON.parse(await page.textContent('.result')))
    .toStrictEqual({
      '../external/x.js': 'hello from x',
      '../external/y.js': 'hello from y',
    })
})
