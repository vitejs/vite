import { untilUpdated } from '../../testUtils'

test('should load literal dynamic import', async () => {
  await page.click('.baz')
  await untilUpdated(() => page.textContent('.view'), 'Baz view')
})

test('should load full dynamic import from public', async () => {
  await page.click('.qux')
  await untilUpdated(() => page.textContent('.view'), 'Qux view')
})

// since this test has a timeout, it should be put last so that it
// does not bleed on the last
test('should load dynamic import with vars', async () => {
  await page.click('.foo')
  await untilUpdated(() => page.textContent('.view'), 'Foo view')

  // first page click will not load the remote message
  // because vite needs to compile the lodash dependency
  await page.click('.bar')
  await untilUpdated(() => page.textContent('.view'), '')

  // wait until reload and click again
  setTimeout(async () => {
    await page.click('.bar')
    await untilUpdated(() => page.textContent('.view'), 'Bar view')
  }, 10)
})
