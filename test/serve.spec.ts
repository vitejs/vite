import { setupPlaygroundTest } from './setup'

setupPlaygroundTest('.')

test('browser should be available', async () => {
  await global.page.screenshot({ path: 'screen.png' })
})
