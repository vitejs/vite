import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { resolveConfig } from '../config'
import { createIsConfiguredAsExternal } from '../external'
import { PartialEnvironment } from '../baseEnvironment'

describe('createIsConfiguredAsExternal', () => {
  test('default', async () => {
    const isExternal = await createIsExternal()
    expect(isExternal('@vitejs/cjs-ssr-dep')).toBe(false)
  })

  test('force external', async () => {
    const isExternal = await createIsExternal(true)
    expect(isExternal('@vitejs/cjs-ssr-dep')).toBe(true)
  })

  test('regex external id match', async () => {
    const isExternal = await createIsExternal(undefined, [
      /^@vitejs\/regex-match$/,
    ])
    expect(isExternal('@vitejs/regex-match')).toBe(true)
    expect(isExternal('@vitejs/regex-mismatch')).toBe(false)
  })

  test('regex external package match', async () => {
    const isExternal = await createIsExternal(undefined, [
      /^@vitejs\/regex-package/,
    ])
    expect(isExternal('@vitejs/regex-package/foo')).toBe(true)
    expect(isExternal('@vitejs/regex-package')).toBe(true)
    expect(isExternal('@vitejs/not-regex-package/foo')).toBe(false)
  })

  test('regex external takes precedence over noExternal for explicit matches', async () => {
    const isExternal = await createIsExternal(
      undefined,
      [/^@vitejs\/regex-overlap/],
      ['@vitejs/regex-overlap'],
    )
    expect(isExternal('@vitejs/regex-overlap')).toBe(true)
    expect(isExternal('@vitejs/regex-overlap/sub')).toBe(true)
  })

  test('noExternal alone keeps dependencies bundled', async () => {
    const isExternal = await createIsExternal(undefined, undefined, [
      '@vitejs/no-external',
    ])
    expect(isExternal('@vitejs/no-external')).toBe(false)
    expect(isExternal('@vitejs/no-external/sub')).toBe(false)
  })
})

async function createIsExternal(
  external?: true,
  resolveExternal?: (string | RegExp)[],
  noExternal?: (string | RegExp)[] | true,
) {
  const resolvedConfig = await resolveConfig(
    {
      configFile: false,
      root: fileURLToPath(new URL('./', import.meta.url)),
      resolve: {
        external,
      },
      environments: {
        ssr: {
          resolve: {
            external: resolveExternal,
            noExternal,
          },
        },
      },
    },
    'serve',
  )
  const environment = new PartialEnvironment('ssr', resolvedConfig)
  return createIsConfiguredAsExternal(environment)
}
