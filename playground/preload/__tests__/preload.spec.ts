import { isBuild } from '../../testUtils'

test('should have no 404s', () => {
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('404')
  })
})

if (isBuild) {
  test('dynamic import', async () => {
    const appHtml = await page.content()
    expect(appHtml).toMatch('This is <b>home</b> page.')
  })

  test('dynamic import with comments', async () => {
    await page.goto(viteTestUrl + '/#/hello')
    const html = await page.content()
    expect(html).toMatch(
      /link rel="modulepreload".*?href="\/assets\/Hello\.\w{8}\.js"/
    )
    expect(html).toMatch(
      /link rel="stylesheet".*?href="\/assets\/Hello\.\w{8}\.css"/
    )
  })
}
