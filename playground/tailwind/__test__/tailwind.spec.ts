import { expect, test } from 'vitest'
import {
  editFile,
  getColor,
  isBuild,
  page,
  untilBrowserLogAfter,
  untilUpdated,
} from '~utils'

test('should render', async () => {
  expect(await page.textContent('#pagetitle')).toBe('|Page title|')
})

if (!isBuild) {
  test('regenerate CSS and HMR (glob pattern)', async () => {
    const el = await page.$('#pagetitle')
    const el2 = await page.$('#helloroot')
    expect(await getColor(el)).toBe('rgb(11, 22, 33)')

    await untilBrowserLogAfter(
      () =>
        editFile('src/views/Page.vue', (code) =>
          code.replace('|Page title|', '|Page title updated|'),
        ),
      [
        '[vite] css hot updated: /index.css',
        '[vite] hot updated: /src/views/Page.vue',
      ],
      false,
    )
    await untilUpdated(() => el.textContent(), '|Page title updated|')

    await untilBrowserLogAfter(
      () =>
        editFile('src/components/HelloWorld.vue', (code) =>
          code.replace('text-gray-800', 'text-[rgb(10,20,30)]'),
        ),
      [
        '[vite] css hot updated: /index.css',
        '[vite] hot updated: /src/components/HelloWorld.vue',
      ],
      false,
    )
    await untilUpdated(() => getColor(el2), 'rgb(10, 20, 30)')
  })

  test('regenerate CSS and HMR (relative path)', async () => {
    const el = await page.$('h1')
    expect(await getColor(el)).toBe('black')

    await untilBrowserLogAfter(
      () =>
        editFile('src/App.vue', (code) =>
          code.replace('text-black', 'text-[rgb(11,22,33)]'),
        ),
      [
        '[vite] css hot updated: /index.css',
        '[vite] hot updated: /src/App.vue',
      ],
      false,
    )
    await untilUpdated(() => getColor(el), 'rgb(11, 22, 33)')
  })
}
