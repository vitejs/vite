import { setupPlaygroundTest } from './setup'

setupPlaygroundTest('.')

test('browser should be available', async () => {
  expect(await global.page.textContent('pre')).toMatch('loaded')
})
