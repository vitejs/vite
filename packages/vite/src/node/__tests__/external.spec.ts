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
