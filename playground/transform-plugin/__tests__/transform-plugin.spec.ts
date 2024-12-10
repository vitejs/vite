import { expect, test } from 'vitest'
import { editFile, isBuild, page, untilUpdated } from '~utils'

test('should re-run transform when dependencies are edited', async () => {
  expect(await page.textContent('#transform-count')).toBe('1')

  if (isBuild) return
  editFile('plugin-dep.js', (str) => str)
  await untilUpdated(() => page.textContent('#transform-count'), '2')

  editFile('plugin-dep-load.js', (str) => str)
  await untilUpdated(() => page.textContent('#transform-count'), '3')
})
