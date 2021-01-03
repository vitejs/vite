import { untilUpdated } from '../../testUtils'

test('should work when inlined', async () => {
  await page.click('.inline-wasm .run')
  await untilUpdated(() => page.textContent('.inline-wasm .result'), '42')
})

test('should work when output', async () => {
  await page.click('.output-wasm .run')
  await untilUpdated(() => page.textContent('.output-wasm .result'), '24')
})
