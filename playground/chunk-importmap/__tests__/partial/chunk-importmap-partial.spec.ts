import { expect, test } from 'vitest'
import { browserLogs, getColor, isBuild, page } from '~utils'

test('should have no 404s', () => {
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('404')
  })
})

test.runIf(isBuild)(
  'only the included chunk is in the import map',
  async () => {
    // the generated import map comes after the one from `index.html`
    const importMap = await page
      .locator('script[type="importmap"]')
      .last()
      .textContent()
    expect(
      Object.keys(JSON.parse(importMap!).imports)
        .map((key) => key.replace(/-[\w-]{8}(\.\w+)$/, '$1'))
        .sort(),
    ).toStrictEqual(['/assets/static.css', '/assets/static.js'])
  },
)

test('js', async () => {
  await expect.poll(() => page.textContent('.js')).toBe('js: ok')
  await expect.poll(() => page.textContent('.static-js')).toBe('static-js: ok')
  await expect
    .poll(() => page.textContent('.dynamic-js'))
    .toBe('dynamic-js: ok')
  await expect.poll(() => page.textContent('.shared-js')).toBe('shared-js: ok')
})

test('css', async () => {
  await expect.poll(() => getColor('.static')).toBe('red')
  await expect.poll(() => getColor('.dynamic')).toBe('red')
  await expect.poll(() => getColor('.direct-dynamic')).toBe('red')
  await expect.poll(() => getColor('.shared')).toBe('green')
})
