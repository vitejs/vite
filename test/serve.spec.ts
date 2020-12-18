import { setupPlaygroundTest } from './setup'

setupPlaygroundTest()

test('browser should be available', async () => {
  expect(await page.textContent('pre')).toMatch('loaded')
})
