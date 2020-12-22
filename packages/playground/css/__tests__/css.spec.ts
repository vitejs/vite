import { editFile, getColor, untilUpdated } from '../../testUtils'

// note: tests should retrieve the element at the beginning of test and reuse it
// in later assertions to ensure CSS HMR doesn't reload the page

test('linked css', async () => {
  const linked = await page.$('.linked')
  const atImport = await page.$('.linked-at-import')

  expect(await getColor(linked)).toBe('blue')
  expect(await getColor(atImport)).toBe('red')

  editFile('linked.css', (code) => code.replace('color: blue', 'color: red'))
  await untilUpdated(() => getColor(linked), 'red')

  editFile('linked-at-import.css', (code) =>
    code.replace('color: red', 'color: blue')
  )
  await untilUpdated(() => getColor(atImport), 'blue')
})

test('css import from js', async () => {
  const imported = await page.$('.imported')
  const atImport = await page.$('.imported-at-import')

  expect(await getColor(imported)).toBe('green')
  expect(await getColor(atImport)).toBe('purple')

  editFile('imported.css', (code) => code.replace('color: green', 'color: red'))
  await untilUpdated(() => getColor(imported), 'red')

  editFile('imported-at-import.css', (code) =>
    code.replace('color: purple', 'color: blue')
  )
  await untilUpdated(() => getColor(atImport), 'blue')
})

test('sass', async () => {
  const imported = await page.$('.sass')
  const atImport = await page.$('.sass-at-import')

  expect(await getColor(imported)).toBe('orange')
  expect(await getColor(atImport)).toBe('olive')

  editFile('sass.scss', (code) => code.replace('color: orange', 'color: red'))
  await untilUpdated(() => getColor(imported), 'red')

  editFile('sass-at-import.scss', (code) =>
    code.replace('color: olive', 'color: blue')
  )
  await untilUpdated(() => getColor(atImport), 'blue')
})

test('css modules', async () => {
  const imported = await page.$('.modules')
  expect(await getColor(imported)).toBe('turquoise')
  editFile('mod.module.css', (code) =>
    code.replace('color: turquoise', 'color: red')
  )
  await untilUpdated(() => getColor(imported), 'red')
})

test('css modules w/ sass', async () => {
  const imported = await page.$('.modules-sass')
  expect(await getColor(imported)).toBe('orangered')
  editFile('mod.module.scss', (code) =>
    code.replace('color: orangered', 'color: blue')
  )
  await untilUpdated(() => getColor(imported), 'blue')
})
