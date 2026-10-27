import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { PartialEnvironment } from '../baseEnvironment'
import { resolveConfig } from '../config'
import type { Environment } from '../environment'
import { createIsConfiguredAsExternal, shouldExternalize } from '../external'

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

describe('shouldExternalize', () => {
  // `@vitejs/child` can be resolved from `packages/parent`, but not from here
  const parentImporter = fileURLToPath(
    new URL('./packages/parent/index.ts', import.meta.url),
  )
  const otherImporter = fileURLToPath(import.meta.url)

  test('does not reuse the result across importer directories', async () => {
    const environment = await createEnvironment(true)
    expect(
      shouldExternalize(environment, '@vitejs/child', parentImporter),
    ).toBe(true)
    expect(shouldExternalize(environment, '@vitejs/child', otherImporter)).toBe(
      false,
    )
  })

  test('does not reuse the result across importer directories in reverse order', async () => {
    const environment = await createEnvironment(true)
    expect(shouldExternalize(environment, '@vitejs/child', otherImporter)).toBe(
      false,
    )
    expect(
      shouldExternalize(environment, '@vitejs/child', parentImporter),
    ).toBe(true)
  })
})

async function createIsExternal(external?: true) {
  return createIsConfiguredAsExternal(await createEnvironment(external))
}

async function createEnvironment(external?: true) {
  const resolvedConfig = await resolveConfig(
    {
      configFile: false,
      root: fileURLToPath(new URL('./', import.meta.url)),
      resolve: { external },
    },
    'serve',
  )
  return new PartialEnvironment('ssr', resolvedConfig) as unknown as Environment
}
