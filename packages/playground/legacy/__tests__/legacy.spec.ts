import { isBuild } from '../../testUtils'

test('should work', async () => {
  expect(await page.textContent('#app')).toMatch('Hello')
})

test('import.meta.env.LEGACY', async () => {
  if (isBuild) {
    expect(await page.textContent('#env')).toMatch('true')

    const modernSrc = await page.$eval(
      'script[type="module-disabled"]',
      (el: HTMLScriptElement) => el.src
    )

    // false after the modern chunk was executed
    await page.addScriptTag({ url: modernSrc, type: 'module' })
    expect(await page.textContent('#env')).toMatch('false')

    // reload so execution of the modern chunk can't mess with other tests
    await page.reload()
  } else {
    // always false in dev
    expect(await page.textContent('#env')).toMatch('false')
  }
})
