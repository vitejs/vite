import { isBuild } from 'testUtils'

const mode = isBuild ? `production` : `development`

test('base', async () => {
  expect(await page.textContent('.base')).toBe('/')
})

test('mode', async () => {
  expect(await page.textContent('.mode')).toBe(mode)
})

test('dev', async () => {
  expect(await page.textContent('.dev')).toBe(String(!isBuild))
})

test('prod', async () => {
  expect(await page.textContent('.prod')).toBe(String(isBuild))
})

test('custom', async () => {
  expect(await page.textContent('.custom')).toBe('1')
})

test('mode file override', async () => {
  expect(await page.textContent('.mode-file')).toBe(`.env.${mode}`)
})

test('inline variables', async () => {
  expect(await page.textContent('.inline')).toBe(
    isBuild ? `inline-build` : `inline-serve`
  )
})

test('NODE_ENV', async () => {
  expect(await page.textContent('.node-env')).toBe(mode)
})

test('env object', async () => {
  const envText = await page.textContent('.env-object')
  expect(JSON.parse(envText)).toMatchObject({
    VITE_EFFECTIVE_MODE_FILE_NAME: `.env.${mode}`,
    VITE_CUSTOM_ENV_VARIABLE: '1',
    BASE_URL: '/',
    MODE: mode,
    DEV: !isBuild,
    PROD: isBuild
  })
})
