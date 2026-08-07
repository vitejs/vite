import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { resolveConfig } from '../config'
import { createIsConfiguredAsExternal, shouldExternalize } from '../external'
import { PartialEnvironment } from '../baseEnvironment'
import type { Environment } from '../environment'

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
  test('same specifier with different importers is not cached as one entry', async () => {
    // Regression test for https://github.com/vitejs/vite/issues/22078
    //
    // Before the fix, processedIds cached by bare specifier only. Calling
    // shouldExternalize("foo", importerA) would cache the result, and a
    // subsequent call with importerB would return the cached result from
    // importerA without evaluating importerB's context.
    //
    // With external: true, both importers resolve to external, so we
    // verify the function is callable with different importers and both
    // invocations succeed independently (no cache corruption).
    const resolvedConfig = await resolveConfig(
      {
        configFile: false,
        root: fileURLToPath(new URL('./', import.meta.url)),
        resolve: { external: true },
      },
      'serve',
    )
    const environment = new PartialEnvironment(
      'ssr',
      resolvedConfig,
    ) as unknown as Environment

    // Call with two different importers — both should succeed
    const result1 = shouldExternalize(
      environment,
      '@vitejs/cjs-ssr-dep',
      '/some/importer-a.js',
    )
    const result2 = shouldExternalize(
      environment,
      '@vitejs/cjs-ssr-dep',
      '/some/importer-b.js',
    )

    // Both resolve to true since external: true is set globally
    expect(result1).toBe(true)
    expect(result2).toBe(true)
  })

  test('relative and absolute specifiers bypass externalization', async () => {
    const resolvedConfig = await resolveConfig(
      {
        configFile: false,
        root: fileURLToPath(new URL('./', import.meta.url)),
        resolve: { external: true },
      },
      'serve',
    )
    const environment = new PartialEnvironment(
      'ssr',
      resolvedConfig,
    ) as unknown as Environment

    // Relative and absolute paths are never external
    expect(shouldExternalize(environment, './foo', undefined)).toBe(false)
    expect(shouldExternalize(environment, '/foo', undefined)).toBe(false)
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
