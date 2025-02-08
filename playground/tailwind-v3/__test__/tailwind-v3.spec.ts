import { expect, test } from 'vitest'
import {
  editFile,
  getColor,
  isServe,
  page,
  untilBrowserLogAfter,
  untilUpdated,
} from '~utils'

test('should render', async () => {
  expect(await page.textContent('#pagetitle')).toBe('Page title')
})

test.runIf(isServe)('regenerate CSS and HMR (glob pattern)', async () => {
  const el = page.locator('#view1-text')
  expect(await getColor(el)).toBe('rgb(22, 163, 74)')

  await untilBrowserLogAfter(
    () =>
      editFile('src/views/view1.js', (code) =>
        code.replace('|view1|', '|view1 updated|'),
      ),
    [
      '[vite] css hot updated: /index.css',
      '[vite] hot updated: /src/views/view1.js via /src/main.js',
    ],
    false,
  )
  await untilUpdated(() => el.textContent(), '|view1 updated|')

  await untilBrowserLogAfter(
    () =>
      editFile('src/views/view1.js', (code) =>
        code.replace('text-green-600', 'text-orange-600'),
      ),
    [
      '[vite] css hot updated: /index.css',
      '[vite] hot updated: /src/views/view1.js via /src/main.js',
    ],
    false,
  )
  await untilUpdated(async () => getColor(el), 'rgb(234, 88, 12)')
})

test.runIf(isServe)(
  'same file duplicated in module graph (#4267)',
  async () => {
    const el = page.locator('#component1')
    expect(await getColor(el)).toBe('rgb(220, 38, 38)')

    // when duplicated, page reload happens
    await untilBrowserLogAfter(
      () =>
        editFile('src/components/component1.js', (code) =>
          code.replace('text-red-600', 'text-blue-600'),
        ),
      [
        '[vite] css hot updated: /index.css',
        '[vite] hot updated: /src/components/component1.js',
      ],
      false,
    )
    await untilUpdated(() => getColor(el), 'rgb(37, 99, 235)')
  },
)

test.runIf(isServe)('regenerate CSS and HMR (relative path)', async () => {
  const el = page.locator('#pagetitle')
  expect(await getColor(el)).toBe('rgb(124, 58, 237)')

  await untilBrowserLogAfter(
    () =>
      editFile('src/main.js', (code) =>
        code.replace('text-violet-600', 'text-cyan-600'),
      ),
    ['[vite] css hot updated: /index.css', '[vite] hot updated: /src/main.js'],
    false,
  )
  await untilUpdated(() => getColor(el), 'rgb(8, 145, 178)')
})
