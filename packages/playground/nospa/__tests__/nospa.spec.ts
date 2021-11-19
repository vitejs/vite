// note: tests should retrieve the element at the beginning of test and reuse it
// in later assertions to ensure CSS HMR doesn't reload the page

const assertNotIndexHtml = async (path: string) => {
  await page.goto(viteTestUrl + path)
  const html = await page.innerHTML('body')
  expect(html).not.toContain(
    `This file should only ever be served as /index.html`
  )
}

test('/index.html is served', async () => {
  await page.goto(viteTestUrl + '/index.html')
  const html = await page.innerHTML('body')
  expect(html).toContain(`This file should only ever be served as /index.html`)
})

if (!process.env.VITE_TEST_BUILD) {
  test('/ is not served', async () => {
    await assertNotIndexHtml('/')
  })
  test('/foo/ is not served', async () => {
    await assertNotIndexHtml('/foo/')
  })
  test('/foo/index.html is not served', async () => {
    await assertNotIndexHtml('/foo/index.html')
  })
}
