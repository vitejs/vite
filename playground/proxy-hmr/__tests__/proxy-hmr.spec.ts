import { expect, test } from 'vitest'
import {
  editFile,
  isBuild,
  page,
  untilBrowserLogAfter,
  viteTestUrl,
} from '~utils'

test.runIf(!isBuild)('proxy-hmr', async () => {
  await untilBrowserLogAfter(
    () => page.goto(viteTestUrl),
    // wait for both main and sub app HMR connection
    [/connected/, /connected/],
  )

  const otherAppTextLocator = page.frameLocator('iframe').locator('.content')
  await expect
    .poll(() => otherAppTextLocator.textContent())
    .toMatch('other app')
  editFile('other-app/index.html', (code) =>
    code.replace('app', 'modified app'),
  )
  await expect
    .poll(() => otherAppTextLocator.textContent())
    .toMatch('other modified app')
})
