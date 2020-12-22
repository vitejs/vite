test('fs', async () => {
  expect(await page.textContent('.fs')).toMatch('[success] alias to fs path')
})

test('fs directory', async () => {
  expect(await page.textContent('.fs-dir')).toMatch(
    '[success] alias to directory'
  )
})

test('regex', async () => {
  expect(await page.textContent('.regex')).toMatch(
    '[success] alias to directory via regex'
  )
})

test('dependency', async () => {
  expect(await page.textContent('.dep')).toMatch('[success] out of root')
})
