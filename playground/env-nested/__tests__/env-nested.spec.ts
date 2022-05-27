import { isBuild, page } from '~utils'

const mode = isBuild ? `production` : `development`

test('mode', async () => {
  expect(await page.textContent('.mode')).toBe(mode)
})

test('mode file override', async () => {
  expect(await page.textContent('.mode-file')).toBe(`.env.${mode}`)
})

test('should not load parent .env file', async () => {
  expect(await page.textContent('.parent-env')).not.toBe('dont_load_me')
})
