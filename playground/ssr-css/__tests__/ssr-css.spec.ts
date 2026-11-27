import { expect, test } from 'vitest'
import { getColor, page, viteTestUrl } from '~utils'

for (const lang of ['css', 'sass', 'less']) {
  test(`${lang} package import in SSR`, async () => {
    await page.goto(viteTestUrl)
    expect(await getColor(`.${lang}-dep`)).toBe('green')
  })
}
