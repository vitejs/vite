import { test } from 'vitest'
import { editFile, page, untilUpdated, viteTestUrl } from '~utils'

test('proxy-hmr', async () => {
  await page.goto(viteTestUrl)
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
