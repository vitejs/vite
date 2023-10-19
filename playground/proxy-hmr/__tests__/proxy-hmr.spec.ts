import { test } from 'vitest'
import {
  editFile,
  page,
  untilBrowserLogAfter,
  untilUpdated,
  viteTestUrl,
} from '~utils'

test('proxy-hmr', async () => {
  await untilBrowserLogAfter(
    () => page.goto(viteTestUrl),
    // wait for both main and sub app HMR connection
    [/connected/, /connected/],
  )

  const otherAppTextLocator = page.frameLocator('iframe').locator('.content')
  await untilUpdated(() => otherAppTextLocator.textContent(), 'other app')
  editFile('other-app/index.html', (code) =>
    code.replace('app', 'modified app'),
  )
  await untilUpdated(
    () => otherAppTextLocator.textContent(),
    'other modified app',
  )
})
