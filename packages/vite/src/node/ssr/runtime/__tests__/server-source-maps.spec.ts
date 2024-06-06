import { describe, expect } from 'vitest'
import type { ViteRuntime } from 'vite/runtime'
import { createViteRuntimeTester, editFile, resolvePath } from './utils'

describe('vite-runtime initialization', async () => {
  const it = await createViteRuntimeTester(
    {},
    {
      sourcemapInterceptor: 'prepareStackTrace',
    },
  )

  const getError = async (cb: () => void): Promise<Error> => {
    try {
      await cb()
      expect.unreachable()
    } catch (err) {
      return err
    }
  }
  const serializeStack = (runtime: ViteRuntime, err: Error) => {
    return err.stack!.split('\n')[1].replace(runtime.options.root, '<root>')
  }
  const serializeStackDeep = (runtime: ViteRuntime, err: Error) => {
    return err
      .stack!.split('\n')
      .map((s) => s.replace(runtime.options.root, '<root>'))
  }

  it('source maps are correctly applied to stack traces', async ({
    runtime,
    server,
  }) => {
    expect.assertions(3)
    const topLevelError = await getError(() =>
      runtime.executeUrl('/fixtures/has-error.js'),
    )
    expect(serializeStack(runtime, topLevelError)).toBe(
      '    at <root>/fixtures/has-error.js:2:7',
    )

    const methodError = await getError(async () => {
      const mod = await runtime.executeUrl('/fixtures/throws-error-method.ts')
      mod.throwError()
    })
    expect(serializeStack(runtime, methodError)).toBe(
      '    at Module.throwError (<root>/fixtures/throws-error-method.ts:6:9)',
    )

    // simulate HMR
    editFile(
      resolvePath(import.meta.url, './fixtures/throws-error-method.ts'),
      (code) => '\n\n\n\n\n' + code + '\n',
    )
    runtime.moduleCache.clear()
    server.moduleGraph.invalidateAll()

    const methodErrorNew = await getError(async () => {
      const mod = await runtime.executeUrl('/fixtures/throws-error-method.ts')
      mod.throwError()
    })

    expect(serializeStack(runtime, methodErrorNew)).toBe(
      '    at Module.throwError (<root>/fixtures/throws-error-method.ts:11:9)',
    )
  })

  it('deep stacktrace', async ({ runtime }) => {
    const methodError = await getError(async () => {
      const mod = await runtime.executeUrl('/fixtures/has-error-deep.ts')
      mod.main()
    })
    expect(serializeStackDeep(runtime, methodError).slice(0, 3)).toEqual([
      'Error: crash',
      '    at crash (<root>/fixtures/has-error-deep.ts:2:9)',
      '    at Module.main (<root>/fixtures/has-error-deep.ts:6:3)',
    ])
  })
})
