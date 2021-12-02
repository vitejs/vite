import { port } from './serve'

const url = `http://localhost:${port}`

/**
 * test for #5809
 *
 * NOTE: This test will always succeed now, unless the temporary workaround for Jest can be removed
 * See https://github.com/vitejs/vite/pull/5197#issuecomment-938054077
 */
test('msg from node addon', async () => {
  await page.goto(url)
  expect(await page.textContent('.node-addon-msg')).toMatch('Hello World!')
})

test('msg read by fs/promises', async () => {
  await page.goto(url)
  expect(await page.textContent('.file-message')).toMatch('File Content!')
})
