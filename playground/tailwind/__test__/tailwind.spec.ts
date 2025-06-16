import { expect, test } from 'vitest'
import { editFile, getColor, isServe, page, untilBrowserLogAfter } from '~utils'

test('should render', async () => {
  expect(await page.textContent('#pagetitle')).toBe('Page title')
})

test.runIf(isServe)('regenerate CSS and HMR (glob pattern)', async () => {
  const el = page.locator('#view1-text')
  expect(await getColor(el)).toBe('oklch(0.627 0.194 149.214)')

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
  await expect.poll(() => el.textContent()).toMatch('|view1 updated|')

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
  await expect.poll(() => getColor(el)).toBe('oklch(0.646 0.222 41.116)')
})

test.runIf(isServe)(
  'same file duplicated in module graph (#4267)',
  async () => {
    const el = page.locator('#component1')
    expect(await getColor(el)).toBe('oklch(0.577 0.245 27.325)')

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
    await expect.poll(() => getColor(el)).toBe('oklch(0.546 0.245 262.881)')
  },
)

test.runIf(isServe)('regenerate CSS and HMR (relative path)', async () => {
  const el = page.locator('#pagetitle')
  expect(await getColor(el)).toBe('oklch(0.541 0.281 293.009)')

  await untilBrowserLogAfter(
    () =>
      editFile('src/main.js', (code) =>
        code.replace('text-violet-600', 'text-cyan-600'),
      ),
    ['[vite] css hot updated: /index.css', '[vite] hot updated: /src/main.js'],
    false,
  )
  await expect.poll(() => getColor(el)).toBe('oklch(0.609 0.126 221.723)')
})
