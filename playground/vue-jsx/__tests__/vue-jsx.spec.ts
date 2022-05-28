import { editFile, isServe, page, untilUpdated } from '~utils'

test('should render', async () => {
  expect(await page.textContent('.named')).toMatch('0')
  expect(await page.textContent('.named-specifier')).toMatch('1')
  expect(await page.textContent('.default')).toMatch('2')
  expect(await page.textContent('.default-tsx')).toMatch('3')
  expect(await page.textContent('.script')).toMatch('4')
  expect(await page.textContent('.src-import')).toMatch('5')
  expect(await page.textContent('.jsx-with-query')).toMatch('6')
  expect(await page.textContent('.other-ext')).toMatch('Other Ext')
  expect(await page.textContent('.ts-import')).toMatch('success')
})

test('should update', async () => {
  await page.click('.named')
  expect(await page.textContent('.named')).toMatch('1')
  await page.click('.named-specifier')
  expect(await page.textContent('.named-specifier')).toMatch('2')
  await page.click('.default')
  expect(await page.textContent('.default')).toMatch('3')
  await page.click('.default-tsx')
  expect(await page.textContent('.default-tsx')).toMatch('4')
  await page.click('.script')
  expect(await page.textContent('.script')).toMatch('5')
  await page.click('.src-import')
  expect(await page.textContent('.src-import')).toMatch('6')
  await page.click('.jsx-with-query')
  expect(await page.textContent('.jsx-with-query')).toMatch('7')
})

describe.runIf(isServe)('vue-jsx server', () => {
  test('hmr: named export', async () => {
    editFile('Comps.jsx', (code) =>
      code.replace('named {count', 'named updated {count')
    )
    await untilUpdated(() => page.textContent('.named'), 'named updated 0')

    // affect all components in same file
    expect(await page.textContent('.named-specifier')).toMatch('1')
    expect(await page.textContent('.default')).toMatch('2')
    // should not affect other components from different file
    expect(await page.textContent('.default-tsx')).toMatch('4')
  })

  test('hmr: named export via specifier', async () => {
    editFile('Comps.jsx', (code) =>
      code.replace('named specifier {count', 'named specifier updated {count')
    )
    await untilUpdated(
      () => page.textContent('.named-specifier'),
      'named specifier updated 1'
    )

    // affect all components in same file
    expect(await page.textContent('.default')).toMatch('2')
    // should not affect other components on the page
    expect(await page.textContent('.default-tsx')).toMatch('4')
  })

  test('hmr: default export', async () => {
    editFile('Comps.jsx', (code) =>
      code.replace('default {count', 'default updated {count')
    )
    await untilUpdated(() => page.textContent('.default'), 'default updated 2')

    // should not affect other components on the page
    expect(await page.textContent('.default-tsx')).toMatch('4')
  })

  test('hmr: named export via specifier', async () => {
    // update another component
    await page.click('.named')
    expect(await page.textContent('.named')).toMatch('1')

    editFile('Comp.tsx', (code) =>
      code.replace('default tsx {count', 'default tsx updated {count')
    )
    await untilUpdated(
      () => page.textContent('.default-tsx'),
      'default tsx updated 3'
    )

    // should not affect other components on the page
    expect(await page.textContent('.named')).toMatch('1')
  })

  test('hmr: script in .vue', async () => {
    editFile('Script.vue', (code) =>
      code.replace('script {count', 'script updated {count')
    )
    await untilUpdated(() => page.textContent('.script'), 'script updated 4')

    expect(await page.textContent('.src-import')).toMatch('6')
  })

  test('hmr: src import in .vue', async () => {
    await page.click('.script')
    editFile('SrcImport.jsx', (code) =>
      code.replace('src import {count', 'src import updated {count')
    )
    await untilUpdated(
      () => page.textContent('.src-import'),
      'src import updated 5'
    )

    expect(await page.textContent('.script')).toMatch('5')
  })

  test('hmr: setup jsx in .vue', async () => {
    editFile('setup-syntax-jsx.vue', (code) =>
      code.replace('let count = ref(100)', 'let count = ref(1000)')
    )
    await untilUpdated(() => page.textContent('.setup-jsx'), '1000')
  })
})
