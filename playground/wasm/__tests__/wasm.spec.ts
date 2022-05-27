import { isBuild, page, untilUpdated } from '~utils'

test('should work when inlined', async () => {
  await page.click('.inline-wasm .run')
  await untilUpdated(() => page.textContent('.inline-wasm .result'), '42')
})

test('should work when output', async () => {
  await page.click('.output-wasm .run')
  await untilUpdated(() => page.textContent('.output-wasm .result'), '24')
})

test('init function returns WebAssembly.Instance', async () => {
  await page.click('.init-returns-instance .run')
  await untilUpdated(
    () => page.textContent('.init-returns-instance .result'),
    'true'
  )
})

test('?url', async () => {
  expect(await page.textContent('.url')).toMatch(
    isBuild ? 'data:application/wasm' : '/light.wasm'
  )
})

test('should work when wasm in worker', async () => {
  await untilUpdated(() => page.textContent('.worker-wasm .result'), '3')
})
