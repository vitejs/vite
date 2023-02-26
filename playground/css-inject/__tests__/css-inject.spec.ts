import { expect, test } from 'vitest'
import { editFile, getColor, page, untilUpdated } from '~utils'

test('css inject', async () => {
  const linkedOutside = await page.$('.linked.outside')
  const linkedInside = await page.$('.linked.inside')
  const importedOutside = await page.$('.imported.outside')
  const importedInside = await page.$('.imported.inside')

  expect(await getColor(linkedOutside)).toBe('red')
  expect(await getColor(linkedInside)).toBe('black')
  expect(await getColor(importedOutside)).toBe('black')
  expect(await getColor(importedInside)).toBe('red')

  editFile('linked.css', (code) => code.replace('color: red', 'color: blue'))

  await untilUpdated(() => getColor(linkedOutside), 'blue')
  expect(await getColor(linkedInside)).toBe('black')

  editFile('imported.css', (code) => code.replace('color: red', 'color: blue'))

  await untilUpdated(() => getColor(importedInside), 'blue')
  expect(await getColor(importedOutside)).toBe('black')
})
