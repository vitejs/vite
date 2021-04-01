import { isBuild, untilUpdated } from '../../testUtils'

test('should load literal dynamic import', async () => {
  await page.click('.baz')
  await untilUpdated(() => page.textContent('.view'), 'Baz view', true)
})

test('should load full dynamic import from public', async () => {
  await page.click('.qux')
  await untilUpdated(() => page.textContent('.view'), 'Qux view', true)
})

test('should load data URL of `blob:`', async () => {
  await page.click('.issue-2658-1')
  await untilUpdated(() => page.textContent('.view'), 'blob', true)
})

test('should load data URL of `data:`', async () => {
  await page.click('.issue-2658-2')
  await untilUpdated(() => page.textContent('.view'), 'data', true)
})

// since this test has a timeout, it should be put last so that it
// does not bleed on the last
test('should load dynamic import with vars', async () => {
  await page.click('.foo')
  await untilUpdated(() => page.textContent('.view'), 'Foo view', true)

  await page.click('.bar')
  await untilUpdated(() => page.textContent('.view'), 'Bar view', true)
})
