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
}
