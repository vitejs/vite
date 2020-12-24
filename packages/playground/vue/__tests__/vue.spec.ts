import { editFile, getColor, isBuild, untilUpdated } from 'testUtils'

test('should render', async () => {
  expect(await page.textContent('h1')).toMatch('Vue SFCs')
})

test('should update', async () => {
  expect(await page.textContent('.hmr-inc')).toMatch('count is 0')
  await page.click('.hmr-inc')
  expect(await page.textContent('.hmr-inc')).toMatch('count is 1')
})

test('template/script latest syntax support', async () => {
  expect(await page.textContent('.syntax')).toBe('baz')
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

describe('css modules', () => {
  test('basic', async () => {
    expect(await getColor('.sfc-css-modules')).toBe('blue')
    editFile('CssModules.vue', (code) =>
      code.replace('color: blue;', 'color: red;')
    )
    await untilUpdated(() => getColor('.sfc-css-modules'), 'red')
  })

  test('with preprocessor + name', async () => {
    expect(await getColor('.sfc-css-modules-with-pre')).toBe('orange')
    editFile('CssModules.vue', (code) =>
      code.replace('color: orange;', 'color: blue;')
    )
    await untilUpdated(() => getColor('.sfc-css-modules-with-pre'), 'blue')
  })
})

describe('template asset reference', () => {
  const assetMatch = isBuild
    ? /\/assets\/asset\.\w{8}\.png/
    : '/assets/asset.png'

  test('should not 404', () => {
    browserLogs.forEach((msg) => {
      expect(msg).not.toMatch('404')
    })
  })

  test('relative import', async () => {
    const el = await page.$('img.relative-import')
    expect(await el.evaluate((el) => (el as HTMLImageElement).src)).toMatch(
      assetMatch
    )
  })

  test('absolute import', async () => {
    const el = await page.$('img.relative-import')
    expect(await el.evaluate((el) => (el as HTMLImageElement).src)).toMatch(
      assetMatch
    )
  })

  test('absolute import from public dir', async () => {
    const el = await page.$('img.public-import')
    expect(await el.evaluate((el) => (el as HTMLImageElement).src)).toMatch(
      `/icon.png`
    )
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
