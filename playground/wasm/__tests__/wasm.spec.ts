import { expect, test } from 'vitest'
import { isBuild, page } from '~utils'

test('should work when inlined', async () => {
  await page.click('.inline-wasm .run')
  await expect
    .poll(() => page.textContent('.inline-wasm .result'))
    .toMatch('42')
})

test('should work when output', async () => {
  await page.click('.output-wasm .run')
  await expect
    .poll(() => page.textContent('.output-wasm .result'))
    .toMatch('24')
})

test('init function returns WebAssembly.Instance', async () => {
  await page.click('.init-returns-instance .run')
  await expect
    .poll(() => page.textContent('.init-returns-instance .result'))
    .toMatch('true')
})

test('?url', async () => {
  expect(await page.textContent('.url')).toMatch(
    isBuild ? 'data:application/wasm' : '/light.wasm',
  )
})

test('should work when wasm in worker', async () => {
  await expect.poll(() => page.textContent('.worker-wasm .result')).toMatch('3')
})
