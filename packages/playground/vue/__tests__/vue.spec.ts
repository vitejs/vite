import { editFile, getColor, untilUpdated } from 'testUtils'

test('should render', async () => {
  expect(await page.textContent('h1')).toMatch('Vue SFCs')
})

test('should update', async () => {
  expect(await page.textContent('.hmr-inc')).toMatch('count is 0')
  await page.click('.hmr-inc')
  expect(await page.textContent('.hmr-inc')).toMatch('count is 1')
})

describe('pre-processors', () => {
  test('pug', async () => {
    expect(await page.textContent('p.pug')).toMatch(
      `This is rendered from <template lang="pug">`
    )
    editFile('PreProcessors.vue', (code) =>
      code.replace('Pre-Processors', 'Updated')
    )
    await untilUpdated(() => page.textContent('h2.pre-processors'), 'Updated')
  })

  test('scss', async () => {
    const el = await page.$('p.pug')
    expect(await getColor(el)).toBe('magenta')
    editFile('PreProcessors.vue', (code) =>
      code.replace('$color: magenta;', '$color: red;')
    )
    await untilUpdated(() => getColor(el), 'red')
  })

  test('less + scoped', async () => {
    const el = await page.$('p.pug-less')
    expect(await getColor(el)).toBe('green')
    editFile('PreProcessors.vue', (code) =>
      code.replace('@color: green;', '@color: blue;')
    )
    await untilUpdated(() => getColor(el), 'blue')
  })
})

describe('hmr', () => {
  test('should re-render and preserve state when template is edited', async () => {
    editFile('Hmr.vue', (code) => code.replace('HMR', 'HMR updated'))
    await untilUpdated(() => page.textContent('h2.hmr'), 'HMR updated')
    expect(await page.textContent('.hmr-inc')).toMatch('count is 1')
  })

  test('should update style and preserve state when style is edited', async () => {
    expect(await getColor('.hmr-inc')).toBe('red')
    editFile('Hmr.vue', (code) => code.replace('color: red;', 'color: blue;'))
    await untilUpdated(() => getColor('.hmr-inc'), 'blue')
    expect(await page.textContent('.hmr-inc')).toMatch('count is 1')
  })

  test('should reload and reset state when script is edited', async () => {
    editFile('Hmr.vue', (code) =>
      code.replace('let foo: number = 0', 'let foo: number = 100')
    )
    await untilUpdated(() => page.textContent('.hmr-inc'), 'count is 100')
  })
})
