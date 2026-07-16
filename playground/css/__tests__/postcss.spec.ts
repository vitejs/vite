import { expect, test } from 'vitest'
import { page } from '~utils'

test('CSS modules with string generateScopedName ignore import queries', async () => {
  const module = await page.$('.modules')
  const className = await module.evaluate((element) =>
    [...element.classList].find((name) => name.startsWith('mod-module__')),
  )
  const css = await page.textContent('.modules-query-inline')

  expect(css).toContain(`.${className}`)
})
