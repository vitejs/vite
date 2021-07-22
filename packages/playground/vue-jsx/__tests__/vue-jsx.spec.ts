import { editFile, isBuild, untilUpdated } from 'testUtils'

test('should render', async () => {
  expect(await page.textContent('.named')).toMatch('0')
  expect(await page.textContent('.named-specifier')).toMatch('1')
  expect(await page.textContent('.default')).toMatch('2')
  expect(await page.textContent('.default-tsx')).toMatch('3')
  expect(await page.textContent('.other-ext')).toMatch('Other Ext')
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
})

if (!isBuild) {
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
}
