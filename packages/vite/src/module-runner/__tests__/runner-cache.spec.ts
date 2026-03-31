import { describe, expect, test } from 'vitest'
import type { HotPayload } from '#types/hot'
import type {
  CachedFetchResult,
  ExternalFetchResult,
  FetchResult,
  ViteFetchResult,
} from '../../shared/invokeMethods'
import { ModuleRunner } from '../runner'
import type { ModuleEvaluator, ModuleRunnerContext } from '../types'

// Minimal evaluator that resolves without executing code
class MockEvaluator implements ModuleEvaluator {
  startOffset = 0
  async runInlinedModule(_context: ModuleRunnerContext): Promise<any> {
    // no-op
  }
  async runExternalModule(_file: string): Promise<any> {
    return { __esModule: true, version: 'mock' }
  }
}

function createMockTransport(
  handler: (
    url: string,
    importer: string | undefined,
    options: any,
  ) => Promise<FetchResult> | FetchResult,
) {
  return {
    invoke: async (data: HotPayload): Promise<{ result: any }> => {
      const payload = data as any
      if (payload.data?.name === 'fetchModule') {
        const [url, importer, options] = payload.data.data
        const result = await handler(url, importer, options)
        return { result }
      }
      if (payload.data?.name === 'getBuiltins') {
        return { result: [] }
      }
      return { result: undefined }
    },
  }
}

describe('module runner cache identity verification', () => {
  // Regression tests for https://github.com/vitejs/vite/issues/22079
  //
  // When a bare specifier (e.g., "@azure/core-lro") is externalized,
  // the module runner caches it by the bare specifier URL. If a second
  // import of the same specifier should resolve to a different physical
  // module, the cache returns the wrong one. The server's { cache: true }
  // response now includes the resolved module ID so the client can detect
  // and recover from this mismatch.

  test('refetches when server cache response has different module id', async () => {
    const fetchCalls: { url: string; cached: boolean }[] = []
    let callCount = 0

    // Simulate: first resolution externalizes to v1, second should be v2
    const externalV1: ExternalFetchResult = {
      externalize: 'file:///path/to/dep-v1/index.js',
      type: 'module',
    }
    const moduleV2: ViteFetchResult = {
      code: 'export const version = "v2"; export const extraExport = "only-in-v2"',
      file: '/path/to/dep-v2/index.js',
      id: '/path/to/dep-v2/index.js',
      url: '/dep-v2/index.js',
      invalidate: false,
    }

    const runner = new ModuleRunner(
      {
        transport: createMockTransport((url, _importer, options) => {
          callCount++
          fetchCalls.push({
            url,
            cached: !!options?.cached,
          })

          if (callCount === 1) {
            // First fetch: externalize to v1
            return externalV1
          }
          if (callCount === 2) {
            // Server resolved to v2 (different module id), but client
            // has v1 cached. Return cache with server's resolved id.
            return {
              cache: true,
              id: moduleV2.id,
            } as CachedFetchResult
          }
          // Third: client detected mismatch, refetches without cache flag
          return moduleV2
        }),
        hmr: false,
        sourcemapInterceptor: false,
      },
      new MockEvaluator(),
    )

    // First import: resolves to v1 (externalized), cached by bare specifier
    await runner.import('shared-dep')
    expect(fetchCalls).toHaveLength(1)

    // Verify v1 is cached under the bare specifier URL
    const cachedMod = runner.evaluatedModules.getModuleByUrl('shared-dep')
    expect(cachedMod).toBeDefined()
    expect(cachedMod!.id).toContain('dep-v1')

    // Second import: client sends cached: true, server returns
    // { cache: true, id: '/path/to/dep-v2/index.js' } — mismatch!
    // Runner should refetch and get v2.
    await runner.import('shared-dep')

    expect(fetchCalls).toHaveLength(3)
    expect(fetchCalls[1]).toEqual({ url: 'shared-dep', cached: true })
    expect(fetchCalls[2]).toEqual({ url: 'shared-dep', cached: false })

    await runner.close()
  })

  test('uses cache when server response has matching module id', async () => {
    const fetchCalls: { url: string; cached: boolean }[] = []
    let callCount = 0

    const externalV1: ExternalFetchResult = {
      externalize: 'file:///path/to/dep-v1/index.js',
      type: 'module',
    }

    const runner = new ModuleRunner(
      {
        transport: createMockTransport((url, _importer, options) => {
          callCount++
          fetchCalls.push({
            url,
            cached: !!options?.cached,
          })

          if (callCount === 1) {
            return externalV1
          }
          // Server confirms same module id — cache is valid
          return {
            cache: true,
            id: externalV1.externalize,
          } as CachedFetchResult
        }),
        hmr: false,
        sourcemapInterceptor: false,
      },
      new MockEvaluator(),
    )

    await runner.import('shared-dep')
    await runner.import('shared-dep')

    // Only 2 calls: fetch + cache confirmation (no refetch)
    expect(fetchCalls).toHaveLength(2)
    expect(fetchCalls[1]).toEqual({ url: 'shared-dep', cached: true })

    await runner.close()
  })

  test('uses cache when server response omits id (backward compat)', async () => {
    const fetchCalls: { url: string; cached: boolean }[] = []
    let callCount = 0

    const externalV1: ExternalFetchResult = {
      externalize: 'file:///path/to/dep-v1/index.js',
      type: 'module',
    }

    const runner = new ModuleRunner(
      {
        transport: createMockTransport((url, _importer, options) => {
          callCount++
          fetchCalls.push({
            url,
            cached: !!options?.cached,
          })

          if (callCount === 1) {
            return externalV1
          }
          // Old-style cache response without id
          return { cache: true } as FetchResult
        }),
        hmr: false,
        sourcemapInterceptor: false,
      },
      new MockEvaluator(),
    )

    await runner.import('shared-dep')
    await runner.import('shared-dep')

    // Only 2 calls: backward compatible, no refetch
    expect(fetchCalls).toHaveLength(2)
    expect(fetchCalls[1]).toEqual({ url: 'shared-dep', cached: true })

    await runner.close()
  })
})
