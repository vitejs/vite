import { describe, expect, test } from 'vitest'
import type { SSROptions } from '..'
import { resolveConfig } from '../../config'
import { createIsConfiguredAsSsrExternal, stripNesting } from '../ssrExternal'

test('stripNesting', async () => {
  expect(stripNesting(['c', 'p1>c1', 'p2 > c2'])).toEqual(['c', 'c1', 'c2'])
})

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
    { configFile: false, ssr: ssrConfig },
    'serve'
  )
  return createIsConfiguredAsSsrExternal(resolvedConfig)
}
