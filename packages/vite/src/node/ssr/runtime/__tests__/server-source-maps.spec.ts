import { runInThisContext } from 'node:vm'
import { resolve } from 'node:path'
import { describe, expect } from 'vitest'
import type { ViteDevServer } from '../../..'
import type { ModuleRunnerContext } from '../../../../module-runner'
import { ESModulesEvaluator } from '../../../../module-runner'
import { SOURCEMAPPING_URL } from '../../../../shared/constants'
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
    const topLevelError = await getError(() =>
      runner.import('/fixtures/has-error-first.js'),
    )
    expect(serializeStack(server, topLevelError)).toBe(
      '    at <root>/fixtures/has-error-first.js:1:7',
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

  it('call site of an imported binding matches Node column', async ({
    runner,
    server,
  }) => {
    // Calls to imported bindings are wrapped with `(0, ...)` to avoid binding
    // `this`. V8 anchors the call-site stack frame of such a parenthesized
    // callee to the argument list `(`, but the frame should still point to the
    // start of the callee (matching Node), i.e. column 1 here, not the `(`.
    // See #19625.
    const error = await getError(() =>
      runner.import('/fixtures/has-error-toplevel.js'),
    )
    expect(serializeStackDeep(server, error).slice(0, 3)).toEqual([
      'Error: crash',
      '    at crash (<root>/fixtures/has-error-toplevel-dep.js:2:9)',
      '    at <root>/fixtures/has-error-toplevel.js:3:1',
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

  it('should not crash when preparing a stack trace while globalThis.Buffer is absent', async ({
    runner,
    server,
  }) => {
    const mod = await runner.import('/fixtures/throws-error-method.ts')
    const methodError = await getError(() => mod.throwError())

    // Realms may legitimately remove `Buffer` after modules were loaded
    // (e.g. browser-parity tests). Preparing a stack in that window must not
    // depend on the global still existing.
    const bufferBackup = globalThis.Buffer
    Reflect.deleteProperty(globalThis, 'Buffer')
    try {
      // `.stack` access lazily invokes `prepareStackTrace`, which decodes the
      // inline source map of the runner module
      expect(serializeStack(server, methodError)).toBe(
        '    at Module.throwError (<root>/fixtures/throws-error-method.ts:6:9)',
      )
    } finally {
      globalThis.Buffer = bufferBackup
    }
  })
})

describe('module runner with node:vm executor', async () => {
  class Evaluator extends ESModulesEvaluator {
    async runInlinedModule(_: ModuleRunnerContext, __: string) {
      // Mimics VitestModuleEvaluator
      const initModule = runInThisContext(
        '() => { throw new Error("example")}',
        {
          lineOffset: 0,
          columnOffset: -100,
          filename: resolve(import.meta.dirname, 'fixtures/a.ts'),
        },
      )

      initModule()
    }
  }

  const it = await createModuleRunnerTester(
    {},
    {
      sourcemapInterceptor: 'prepareStackTrace',
      evaluator: new Evaluator(),
    },
  )

  it('should not crash when error stacktrace contains negative column', async ({
    runner,
  }) => {
    const error = await runner.import('/fixtures/a.ts').catch((err) => err)

    expect(() =>
      error.stack.includes('.stack access triggers the bug'),
    ).not.toThrow()
  })
})

describe('module runner interceptor with inline data: source map', async () => {
  const syntheticFile = '/virtual-bufferless/inline-map.js'
  // Minimal map pointing every generated position at line 1, column 0 of
  // "inline-map-original.ts"
  const syntheticSourceMap = {
    version: 3,
    sources: ['inline-map-original.ts'],
    names: [],
    mappings: 'AAAA',
  }
  // The comment token is composed from SOURCEMAPPING_URL so that this spec
  // file itself never contains it (see shared/constants.ts)
  const syntheticFileContent =
    `throw new Error('example')\n` +
    `//# ${SOURCEMAPPING_URL}=data:application/json;base64,${btoa(
      JSON.stringify(syntheticSourceMap),
    )}\n`

  class Evaluator extends ESModulesEvaluator {
    async runInlinedModule(_: ModuleRunnerContext, __: string) {
      const initModule = runInThisContext(
        '() => { throw new Error("example") }',
        { filename: syntheticFile },
      )

      initModule()
    }
  }

  const it = await createModuleRunnerTester(
    {},
    {
      sourcemapInterceptor: {
        // Serves a file that is not part of the runner module graph and
        // carries an inline base64 source map, so mapping goes through
        // `retrieveSourceMap` instead of the runner graph
        retrieveFile(id) {
          if (id === syntheticFile) {
            return syntheticFileContent
          }
        },
      },
      evaluator: new Evaluator(),
    },
  )

  it('should not crash when decoding an inline source map while globalThis.Buffer is absent', async ({
    runner,
  }) => {
    const error: Error = await runner
      .import('/fixtures/a.ts')
      .catch((err) => err)

    const bufferBackup = globalThis.Buffer
    Reflect.deleteProperty(globalThis, 'Buffer')
    try {
      expect(error.stack).toContain(
        '/virtual-bufferless/inline-map-original.ts:1:1',
      )
    } finally {
      globalThis.Buffer = bufferBackup
    }
  })
})
