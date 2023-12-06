import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import type { SSROptions } from '..'
import { resolveConfig } from '../../config'
import { createIsConfiguredAsSsrExternal } from '../ssrExternal'

describe('createIsConfiguredAsSsrExternal', () => {
  test('default', async () => {
    const isExternal = await createIsExternal()
    expect(isExternal('@vitejs/cjs-ssr-dep')).toBe(false)
  })

  test('force external', async () => {
    const isExternal = await createIsExternal({ external: true })
    expect(isExternal('@vitejs/cjs-ssr-dep')).toBe(true)
  })
})

async function createIsExternal(ssrConfig?: SSROptions) {
  const resolvedConfig = await resolveConfig(
    {
      configFile: false,
      root: fileURLToPath(new URL('./', import.meta.url)),
      ssr: ssrConfig,
    },
    'serve',
  )
  return createIsConfiguredAsSsrExternal(resolvedConfig)
}
