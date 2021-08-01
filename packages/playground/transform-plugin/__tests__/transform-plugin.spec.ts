import { editFile, untilUpdated } from '../../testUtils'

test('should re-run transform when plugin-dep file is edited', async () => {
  expect(await page.textContent('#transform-count')).toBe('1')

  await editFile('plugin-dep.js', (str) => str)
  await untilUpdated(() => page.textContent('#transform-count'), '2')
})
