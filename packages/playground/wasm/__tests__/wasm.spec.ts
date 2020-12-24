import { untilUpdated } from '../../testUtils'

test('should work', async () => {
  await page.click('.run')
  await untilUpdated(() => page.textContent('.result'), 'Wasm result: 42')
})
