import { isBuild, untilUpdated } from '../../testUtils'

test('should load literal dynamic import', async () => {
  await page.click('.baz')
  await untilUpdated(() => page.textContent('.view'), 'Baz view', true)
})

test('should load full dynamic import from public', async () => {
  await page.click('.qux')
  await untilUpdated(() => page.textContent('.view'), 'Qux view', true)
})

test('should load dynamic import with vars', async () => {
  await page.click('.foo')
  await untilUpdated(() => page.textContent('.view'), 'Foo view', true)

  await page.click('.bar')
  await untilUpdated(() => page.textContent('.view'), 'Bar view', true)
})
