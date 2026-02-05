import { describe, expect } from 'vitest'
import type { ViteDevServer } from '../../..'
import {
  createFixtureEditor,
  createModuleRunnerTester,
  resolvePath,
} from './utils'

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
  const serializeStack = (server: ViteDevServer, err: Error) => {
    return err.stack!.split('\n')[1].replace(server.config.root, '<root>')
  }
  const serializeStackDeep = (server: ViteDevServer, err: Error) => {
    return err
      .stack!.split('\n')
      .map((s) => s.replace(server.config.root, '<root>'))
  }

  it('source maps are correctly applied to stack traces', async ({
    runner,
    server,
  }) => {
    expect.assertions(3)
    const topLevelError = await getError(() =>
      runner.import('/fixtures/has-error.js'),
    )
    expect(serializeStack(server, topLevelError)).toBe(
      '    at <root>/fixtures/has-error.js:2:7',
    )

    const methodError = await getError(async () => {
      const mod = await runner.import('/fixtures/throws-error-method.ts')
      mod.throwError()
    })
    expect(serializeStack(server, methodError)).toBe(
      '    at Module.throwError (<root>/fixtures/throws-error-method.ts:6:9)',
    )

    const fixtureEditor = createFixtureEditor()

    // simulate HMR
    fixtureEditor.editFile(
      resolvePath(import.meta.url, './fixtures/throws-error-method.ts'),
      (code) => '\n\n\n\n\n' + code + '\n',
    )
    runner.evaluatedModules.clear()
    server.environments.ssr.moduleGraph.invalidateAll()

    const methodErrorNew = await getError(async () => {
      const mod = await runner.import('/fixtures/throws-error-method.ts')
      mod.throwError()
    })

    expect(serializeStack(server, methodErrorNew)).toBe(
      '    at Module.throwError (<root>/fixtures/throws-error-method.ts:11:9)',
    )
  })

  it('stacktrace column on first line', async ({ runner, server }) => {
    // column is off by "use strict"
    const topLevelError = await getError(() =>
      runner.import('/fixtures/has-error-first.js'),
    )
    expect(serializeStack(server, topLevelError)).toBe(
      '    at <root>/fixtures/has-error-first.js:1:18',
    )

    const topLevelErrorTs = await getError(() =>
      runner.import('/fixtures/has-error-first-comment.ts'),
    )
    expect(serializeStack(server, topLevelErrorTs)).toBe(
      '    at <root>/fixtures/has-error-first-comment.ts:2:7',
    )
  })

  it('deep stacktrace', async ({ runner, server }) => {
    const methodError = await getError(async () => {
      const mod = await runner.import('/fixtures/has-error-deep.ts')
      mod.main()
    })
    expect(serializeStackDeep(server, methodError).slice(0, 3)).toEqual([
      'Error: crash',
      '    at crash (<root>/fixtures/has-error-deep.ts:2:9)',
      '    at Module.main (<root>/fixtures/has-error-deep.ts:6:3)',
    ])
  })

  it('should not crash when sourceMappingURL pattern appears in string literals', async ({
    runner,
    server,
  }) => {
    const mod = await runner.import('/fixtures/string-literal-sourcemap.ts')
    expect(mod.getMessage()).toBe(
      '//# sourceMappingURL=data:application/json;base64,invalidbase64',
    )
    const error = await getError(() => mod.throwError())
    expect(error.message).toBe('Test error for stacktrace')
    expect(serializeStackDeep(server, error).slice(0, 2)).toEqual([
      'Error: Test error for stacktrace',
      '    at Module.throwError (<root>/fixtures/string-literal-sourcemap.ts:11:9)',
    ])
  })

  it('should correctly pickup the url from sources', async ({
    server,
    runner,
  }) => {
    const mod = await runner.import('/fixtures/pre-source-mapped-file.js')
    const error = await getError(() => mod.default())
    // The error stack shows "transpiled-inline.ts" because it is specified in the source map's "sources" field.
    // The file itself does not exist on the file system, but we should still respect "sources".
    // If source maps handling breaks, the stack trace will point to "transpiled-inline.js" instead, which would be a bug.
    expect(serializeStackDeep(server, error).slice(0, 3))
      .toMatchInlineSnapshot(`
      [
        "Error: __TEST_STACK_TRANSPILED_INLINE__",
        "    at innerTestStack (<root>/fixtures/transpiled-inline.ts:22:9)",
        "    at Module.testStack (<root>/fixtures/transpiled-inline.ts:12:3)",
      ]
    `)
  })

  it('esm external stack traces should have correct column numbers', async ({
    runner,
  }) => {
    const error = await getError(() =>
      runner.import('/fixtures/esm-external-column-test.js'),
    )
    const stack = error.stack!.split('\n')
    const innerFrame = stack.find((line) => line.includes('inner'))
    const outerFrame = stack.find((line) => line.includes('outer'))

    // The ESM external module has: "var _padding...; export function outer(fn) { return inner(fn); } function inner(fn) { return fn(); }"
    // The exact columns depend on how Node.js loads the module.
    // The important thing is that they should NOT have 62 subtracted (which was the bug).
    // With the fix, columns should be in a reasonable range (> 60 for both).
    // Without the fix, columns would be incorrectly reduced by 62.
    expect(innerFrame).toBeDefined()
    expect(outerFrame).toBeDefined()

    // Extract column numbers from stack frames like ":1:114)"
    const innerMatch = innerFrame!.match(/:(\d+):(\d+)\)/)
    const outerMatch = outerFrame!.match(/:(\d+):(\d+)\)/)

    expect(innerMatch).toBeDefined()
    expect(outerMatch).toBeDefined()

    const innerCol = parseInt(innerMatch![2])
    const outerCol = parseInt(outerMatch![2])

    // Both columns should be > 60 (with the old bug, they would be around 11 and 52)
    // This verifies the 62-character offset is NOT being incorrectly applied
    expect(innerCol).toBeGreaterThan(60)
    expect(outerCol).toBeGreaterThan(60)
  })
})
