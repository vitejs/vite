import { isBuild } from 'testUtils'

if (isBuild) {
  test('es', async () => {
    expect(await page.textContent('.es')).toBe('It works')
  })

  test('umd', async () => {
    expect(await page.textContent('.umd')).toBe('It works')
  })
} else {
  test('dev', async () => {
    expect(await page.textContent('.demo')).toBe('It works')
  })
}
