import { describe, expect } from 'vitest'
import type { ModuleRunner } from 'vite/module-runner'
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
  const serializeStack = (runner: ModuleRunner, err: Error) => {
    return err.stack!.split('\n')[1].replace(runner.options.root, '<root>')
  }

  it('source maps are correctly applied to stack traces', async ({
    runner: runtime,
    server,
  }) => {
    expect.assertions(3)
    const topLevelError = await getError(() =>
      runtime.import('/fixtures/has-error.js'),
    )
    expect(serializeStack(runtime, topLevelError)).toBe(
      '    at <root>/fixtures/has-error.js:2:7',
    )

    const methodError = await getError(async () => {
      const mod = await runtime.import('/fixtures/throws-error-method.ts')
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
    server.nodeEnvironment.moduleGraph.invalidateAll() // TODO: environment?

    const methodErrorNew = await getError(async () => {
      const mod = await runtime.import('/fixtures/throws-error-method.ts')
      mod.throwError()
    })

    expect(serializeStack(runtime, methodErrorNew)).toBe(
      '    at Module.throwError (<root>/fixtures/throws-error-method.ts:11:9)',
    )
  })
})
