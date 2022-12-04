import { expect, test } from 'vitest'
import { isBuild, page } from '~utils'

const mode = isBuild ? `production` : `development`

test('base', async () => {
  expect(await page.textContent('.base')).toBe('/env/')
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

test('custom-prefix', async () => {
  expect(await page.textContent('.custom-prefix')).toBe('1')
})

test('mode file override', async () => {
  expect(await page.textContent('.mode-file')).toBe(`.env.${mode}`)
})

test('inline variables', async () => {
  expect(await page.textContent('.inline')).toBe(
    isBuild ? `inline-build` : `inline-serve`,
  )
})

test('bool', async () => {
  expect(await page.textContent('.bool')).toBe('boolean')
})

test('NODE_ENV', async () => {
  expect(await page.textContent('.node-env')).toBe(process.env.NODE_ENV)
})

test('expand', async () => {
  expect(await page.textContent('.expand')).toBe('expand')
})

test('env object', async () => {
  const envText = await page.textContent('.env-object')
  expect(JSON.parse(envText)).toMatchObject({
    VITE_EFFECTIVE_MODE_FILE_NAME: `.env.${mode}`,
    CUSTOM_PREFIX_ENV_VARIABLE: '1',
    VITE_CUSTOM_ENV_VARIABLE: '1',
    BASE_URL: '/env/',
    MODE: mode,
    DEV: !isBuild,
    PROD: isBuild,
  })
})

if (!isBuild) {
  test('relative url import script return import.meta.url', async () => {
    expect(await page.textContent('.url')).toMatch('/env/index.js')
  })
}
