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

test('custom in template literal expression', async () => {
  expect(await page.textContent('.custom-template-literal-exp')).toBe('1')
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

test('define', async () => {
  expect(await page.textContent('.bool')).toBe('boolean')
  expect(await page.textContent('.number')).toBe('number')
  expect(await page.textContent('.string')).toBe('string')
  expect(await page.textContent('.stringify-object')).toBe('object')
})

test('NODE_ENV', async () => {
  expect(await page.textContent('.node-env')).toBe(process.env.NODE_ENV)
  expect(await page.textContent('.global-node-env')).toBe(process.env.NODE_ENV)
  expect(await page.textContent('.global-this-node-env')).toBe(
    process.env.NODE_ENV,
  )
})

test('expand', async () => {
  expect(await page.textContent('.expand-a')).toBe('expand')
  expect(await page.textContent('.expand-b')).toBe('depend')
})

test('ssr', async () => {
  expect(await page.textContent('.ssr')).toBe('false')
})

test('env object', async () => {
  const env = JSON.parse(await page.textContent('.env-object'))
  expect(env).not.toHaveProperty([
    'DEPEND_ENV',
    'IRRELEVANT_ENV',
    'IRRELEVANT_ESCAPE_ENV',
  ])
  expect(env).toMatchObject({
    VITE_EFFECTIVE_MODE_FILE_NAME: `.env.${mode}`,
    CUSTOM_PREFIX_ENV_VARIABLE: '1',
    VITE_CUSTOM_ENV_VARIABLE: '1',
    VITE_EXPAND_A: 'expand',
    VITE_EXPAND_B: 'depend',
    VITE_ESCAPE_A: 'escape$',
    VITE_ESCAPE_B: 'escape$',
    BASE_URL: '/env/',
    VITE_BOOL: true,
    SSR: false,
    MODE: mode,
    DEV: !isBuild,
    PROD: isBuild,
    VITE_NUMBER: 123,
    VITE_STRING: '{"123",}',
    VITE_STRINGIFY_OBJECT: {
      a: '1',
      b: '2',
    },
  })
})

test('env object in template literal expression', async () => {
  const envText = await page.textContent('.env-object-in-template-literal-exp')
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

test('ignores import' + '.meta.env in string literals', async () => {
  expect(await page.textContent('.ignores-literal-import-meta-env-dot')).toBe(
    'import' + '.meta.env.',
  )
  expect(await page.textContent('.ignores-literal-import-meta-env')).toBe(
    'import' + '.meta.env',
  )
})
