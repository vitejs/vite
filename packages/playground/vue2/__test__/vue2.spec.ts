import { editFile, getColor, isBuild, untilUpdated } from 'testUtils'

if (!isBuild) {
  test('hmr (vue re-render)', async () => {
    const button = await page.$('.hmr-increment')
    await button!.click()
    expect(await page.textContent('.hmr-increment')).toMatch('>>> 1 <<<')

    editFile('hmr/TestHmr.vue', (content) =>
      content.replace('{{ count }}', 'count is {{ count }}')
    )
    // note: using the same button to ensure the component did only re-render
    // if it's a reload, it would have replaced the button with a new one.
    await untilUpdated(() => page.textContent('.hmr-increment'), 'count is 1')
  })

  test('hmr (vue reload)', async () => {
    editFile('hmr/TestHmr.vue', (content) =>
      content.replace('count: 0', 'count: 1337')
    )
    await untilUpdated(
      () => page.textContent('.hmr-increment'),
      'count is 1337'
    )
  })
}

// if (!isBuild) {
//   test('hmr (style removal)', async () => {
//      editFile('css/TestPostCss.vue', (content) =>
//       content.replace(/<style>(.|\s)*<\/style>/, ``)
//     )
//     await untilUpdated(
//       () => getColor('.postcss-from-sfc'),
//       'rgb(0, 0, 0)'
//     )
//   })
// }

test('SFC <style scoped>', async () => {
  const el = await page.$('.style-scoped')
  expect(await getColor(el!)).toBe('blueviolet')
  if (!isBuild) {
    editFile('css/TestScopedCss.vue', (content) =>
      content.replace('blueviolet', 'black')
    )
    await untilUpdated(() => getColor(el!), 'black')
  }
})

test('SFC <style module>', async () => {
  const el = await page.$('.css-modules-sfc')
  expect(await getColor(el!)).toBe('blue')
  if (!isBuild) {
    editFile('css/TestCssModules.vue', (c) =>
      c.replace('color: blue;', 'color: black;')
    )
    // css module results in component reload so must use fresh selector
    await untilUpdated(() => getColor('.css-modules-sfc'), 'black')
  }
})

test('SFC <custom>', async () => {
  expect(await page.textContent('.custom-block')).toMatch('Custom Block')
  expect(await page.textContent('.custom-block-lang')).toMatch('Custom Block')
  expect(await page.textContent('.custom-block-src')).toMatch('Custom Block')
})

test('SFC src imports', async () => {
  expect(await page.textContent('.src-imports-script')).toMatch(
    'src="./script.ts"'
  )
  const el = await page.$('.src-imports-style')
  expect(await getColor(el!)).toBe('red')
  if (!isBuild) {
    // test style first, should not reload the component
    editFile('src-import/style.css', (c) => c.replace('red', 'black'))
    await untilUpdated(() => getColor(el!), 'black')

    // script
    editFile('src-import/script.ts', (c) => c.replace('hello', 'bye'))
    await untilUpdated(
      () => page.textContent('.src-imports-script'),
      'bye from'
    )
    // template
    // todo fix test, file change is only triggered one event.
    // src/node/server/serverPluginHmr.ts is not triggered, maybe caused by chokidar
    // await editFile('src-import/template.html', (c) =>
    //   c.replace('gray', 'red')
    // )
    // await untilUpdated(
    //   () => page.textContent('.src-imports-style'),
    //   'This should be light red'
    // )
  }
})

test('Jsx', async () => {
  expect(await page.textContent('.jsx')).toMatch('JSX works!')
})

test('JsxSFC', async () => {
  expect(await page.textContent('.jsx-sfc')).toMatch('JSX & SFC works!')
})
