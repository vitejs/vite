import { describe, expect } from 'vitest'
import type { ModuleRunner } from 'vite/module-runner'
import { createModuleRunnerTester, editFile, resolvePath } from './utils'

describe('module runner initialization', async () => {
  const it = await createModuleRunnerTester(
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
  const serializeStackDeep = (runtime: ModuleRunner, err: Error) => {
    return err
      .stack!.split('\n')
      .map((s) => s.replace(runtime.options.root, '<root>'))
  }

  it('source maps are correctly applied to stack traces', async ({
    runner,
    server,
  }) => {
    expect.assertions(3)
    const topLevelError = await getError(() =>
      runner.import('/fixtures/has-error.js'),
    )
    expect(serializeStack(runner, topLevelError)).toBe(
      '    at <root>/fixtures/has-error.js:2:7',
    )

    const methodError = await getError(async () => {
      const mod = await runner.import('/fixtures/throws-error-method.ts')
      mod.throwError()
    })
    expect(serializeStack(runner, methodError)).toBe(
      '    at Module.throwError (<root>/fixtures/throws-error-method.ts:6:9)',
    )

    // simulate HMR
    editFile(
      resolvePath(import.meta.url, './fixtures/throws-error-method.ts'),
      (code) => '\n\n\n\n\n' + code + '\n',
    )
    runner.moduleCache.clear()
    server.environments.ssr.moduleGraph.invalidateAll()

    const methodErrorNew = await getError(async () => {
      const mod = await runner.import('/fixtures/throws-error-method.ts')
      mod.throwError()
    })

    expect(serializeStack(runner, methodErrorNew)).toBe(
      '    at Module.throwError (<root>/fixtures/throws-error-method.ts:11:9)',
    )
  })

  it('deep stacktrace', async ({ runner }) => {
    const methodError = await getError(async () => {
      const mod = await runner.import('/fixtures/has-error-deep.ts')
      mod.main()
    })
    expect(serializeStackDeep(runner, methodError).slice(0, 3)).toEqual([
      'Error: crash',
      '    at crash (<root>/fixtures/has-error-deep.ts:2:9)',
      '    at Module.main (<root>/fixtures/has-error-deep.ts:6:3)',
    ])
  })
})
