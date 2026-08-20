import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { resolveConfig } from '../config'
import { createIsConfiguredAsExternal, isExplicitlyExternal } from '../external'
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
})

describe('isExplicitlyExternal', () => {
  test('matches only explicitly configured bare imports', () => {
    expect(isExplicitlyExternal('vue', ['vue'])).toBe(true)
    expect(isExplicitlyExternal('vue/server-renderer', ['vue'])).toBe(true)
    expect(
      isExplicitlyExternal('react/jsx-runtime', ['react/jsx-runtime']),
    ).toBe(true)
    expect(isExplicitlyExternal('@scope/pkg/subpath', ['@scope/pkg'])).toBe(
      true,
    )
    expect(isExplicitlyExternal('@vitejs/dep', [])).toBe(false)
    expect(isExplicitlyExternal('./local.js', true)).toBe(false)
  })
})

async function createIsExternal(external?: true) {
  const resolvedConfig = await resolveConfig(
    {
      configFile: false,
      root: fileURLToPath(new URL('./', import.meta.url)),
      resolve: { external },
    },
    'serve',
  )
  const environment = new PartialEnvironment('ssr', resolvedConfig)
  return createIsConfiguredAsExternal(environment)
}
