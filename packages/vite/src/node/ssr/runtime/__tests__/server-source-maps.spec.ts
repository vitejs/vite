import { resolve } from 'node:path'
import { runInThisContext } from 'node:vm'
import { describe, expect, vi } from 'vitest'
import type { ViteDevServer } from '../../..'
import type {
  EvaluatedModuleNode,
  ModuleRunnerContext,
} from '../../../../module-runner'
import { ESModulesEvaluator } from '../../../../module-runner'
import {
  MODULE_RUNNER_SOURCEMAPPING_SOURCE,
  SOURCEMAPPING_URL,
} from '../../../../shared/constants'
import type { ViteFetchResult } from '../../../../shared/invokeMethods'
import { createFixtureEditor, runnerTest as it, resolvePath } from './utils'

const getError = async (cb: () => void): Promise<Error> => {
  try {
    await cb()
    expect.unreachable()
  } catch (err: any) {
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

class RecordingEvaluator extends ESModulesEvaluator {
  evaluated = new Map<string, string>()

  async runInlinedModule(
    context: ModuleRunnerContext,
    code: string,
    module: Readonly<EvaluatedModuleNode>,
  ): Promise<any> {
    this.evaluated.set(module.id, code)
    return super.runInlinedModule(context, code, module)
  }
}

const throwsErrorMethod = resolvePath(
  import.meta.url,
  './fixtures/throws-error-method.ts',
)
const inlineMapComment = `${MODULE_RUNNER_SOURCEMAPPING_SOURCE}\n//# ${SOURCEMAPPING_URL}=data:application/json;base64,`

describe('module runner initialization', () => {
  it.override({
    runnerOptions: {
      sourcemapInterceptor: 'prepareStackTrace',
    },
  })

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

  it('stack traces work when Object.prototype is frozen', async ({
    runner,
    server,
  }) => {
    const methodError = await getError(async () => {
      const mod = await runner.import('/fixtures/throws-error-method.ts')
      mod.throwError()
    })

    // simulate `Object.freeze(Object.prototype)` in user code without
    // permanently freezing it for the other tests in this worker: assigning
    // an inherited `constructor` throws exactly like it does when frozen
    const original = Object.getOwnPropertyDescriptor(
      Object.prototype,
      'constructor',
    )!
    Object.defineProperty(Object.prototype, 'constructor', {
      configurable: true,
      get: () => original.value,
      set: () => {
        throw new TypeError(
          `Cannot assign to read only property 'constructor' of object '#<Object>'`,
        )
      },
    })
    try {
      // reading `.stack` for the first time invokes `prepareStackTrace`
      expect(serializeStack(server, methodError)).toBe(
        '    at Module.throwError (<root>/fixtures/throws-error-method.ts:6:9)',
      )
    } finally {
      Object.defineProperty(Object.prototype, 'constructor', original)
    }
  })

  it('deep stacktrace', async ({ runner, server }) => {
    const methodError = await getError(async () => {
      const mod = await runner.import('/fixtures/has-error-deep.ts')
      mod.main()
    })
    expect(serializeStackDeep(server, methodError).slice(0, 3)).toStrictEqual([
      'Error: crash',
      '    at crash (<root>/fixtures/has-error-deep.ts:2:9)',
      '    at Module.main (<root>/fixtures/has-error-deep.ts:6:3)',
    ])
  })

  describe('bundled lazy imports', () => {
    it.override('fullBundle', ['./fixtures/dynamic-import-source-map.js'])

    it('maps lazy module stack traces to the original source', async ({
      runner,
      server,
      environment,
      onTestFinished,
    }) => {
      const fetchModule = vi.spyOn(environment, 'fetchModule')
      onTestFinished(() => fetchModule.mockRestore())

      const entry = await runner.import(
        '/fixtures/dynamic-import-source-map.js',
      )
      const mod = await entry.load()

      expect(fetchModule).toHaveBeenCalledWith(
        expect.stringContaining('/@vite/lazy?'),
        undefined,
        expect.any(Object),
      )

      const error = await getError(() => mod.main())
      expect(serializeStackDeep(server, error).slice(1, 3)).toStrictEqual([
        expect.stringContaining('<root>/fixtures/has-error-deep.ts:2:9'),
        expect.stringContaining('<root>/fixtures/has-error-deep.ts:6:3'),
      ])
    })
  })

  it('preserves async stack frame formatting', async ({ runner, server }) => {
    const error = await getError(async () => {
      const mod = await runner.import('/fixtures/has-error-async.ts')
      await mod.main()
    })
    expect(serializeStackDeep(server, error).slice(0, 4)).toStrictEqual([
      'Error: crash',
      '    at crash (<root>/fixtures/has-error-async.ts:3:9)',
      '    at async Promise.all (index 0)',
      '    at async Module.main (<root>/fixtures/has-error-async.ts:7:3)',
    ])
  })

  it('matches V8 method name formatting', async ({ runner, server }) => {
    const mod = await runner.import('/fixtures/has-error-method-names.ts')

    const getterError = await getError(() => mod.callGetter())
    expect(serializeStack(server, getterError)).toBe(
      '    at get foo (<root>/fixtures/has-error-method-names.ts:3:11)',
    )

    const methodError = await getError(() => mod.callAliasedMethod())
    expect(serializeStack(server, methodError)).toBe(
      '    at F.Foo [as m] (<root>/fixtures/has-error-method-names.ts:9:11)',
    )

    const astralNameError = await getError(() => mod.callAstralNamedMethod())
    expect(serializeStack(server, astralNameError)).toBe(
      '    at 𐐀 [as m] (<root>/fixtures/has-error-method-names.ts:17:11)',
    )
  })

  it('prints the file name of a frame without a source map', async ({
    runner,
  }) => {
    // when a script's sourceURL differs from its file name, the file name is what gets printed
    const error = await getError(() =>
      runner.import('/fixtures/has-error-no-source-map.js'),
    )
    expect(error.stack!.split('\n')[1]).toBe('    at inVm (original.js:1:26)')
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
    expect(serializeStackDeep(server, error).slice(0, 3)).toStrictEqual([
      'Error: crash',
      '    at crash (<root>/fixtures/has-error-toplevel-dep.js:2:9)',
      '    at <root>/fixtures/has-error-toplevel.js:3:1',
    ])
  })

  it('maps stack traces when the module path contains a space', async ({
    runner,
    server,
  }) => {
    const methodError = await getError(async () => {
      const mod = await runner.import('/fixtures/with space/has-error-deep.ts')
      mod.main()
    })
    expect(serializeStackDeep(server, methodError).slice(0, 3)).toStrictEqual([
      'Error: crash',
      '    at crash (<root>/fixtures/with space/has-error-deep.ts:2:9)',
      '    at Module.main (<root>/fixtures/with space/has-error-deep.ts:6:3)',
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
    expect(serializeStackDeep(server, error).slice(0, 2)).toStrictEqual([
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

describe('module runner with dev.sourcemapForDebugger enabled', () => {
  const evaluator = new RecordingEvaluator()
  it.override({
    runnerOptions: { sourcemapInterceptor: 'prepareStackTrace', evaluator },
  })

  it('keeps the map inlined in the evaluated code for debuggers', async ({
    runner,
  }) => {
    await runner.import('/fixtures/throws-error-method.ts')
    const meta = runner.evaluatedModules.getModuleById(throwsErrorMethod)!
      .meta as ViteFetchResult
    expect(meta).not.toHaveProperty('sourceMap')
    expect(evaluator.evaluated.get(throwsErrorMethod)).toContain(
      inlineMapComment,
    )
  })
})

describe('module runner with dev.sourcemapForDebugger disabled', () => {
  const evaluator = new RecordingEvaluator()
  it.override({
    config: {
      environments: { ssr: { dev: { sourcemapForDebugger: false } } },
    },
    // let `createServerModuleRunner` pick the interceptor
    runnerOptions: { sourcemapInterceptor: undefined, evaluator },
  })

  it('evaluates code without a map and still maps stack traces', async ({
    runner,
    server,
  }) => {
    expect(runner.options.sourcemapInterceptor).not.toBe('node')

    const error = await getError(async () => {
      const mod = await runner.import('/fixtures/has-error-deep.ts')
      mod.main()
    })
    expect(serializeStackDeep(server, error).slice(0, 3)).toStrictEqual([
      'Error: crash',
      '    at crash (<root>/fixtures/has-error-deep.ts:2:9)',
      '    at Module.main (<root>/fixtures/has-error-deep.ts:6:3)',
    ])

    const id = resolvePath(import.meta.url, './fixtures/has-error-deep.ts')
    const meta = runner.evaluatedModules.getModuleById(id)!
      .meta as ViteFetchResult
    expect(JSON.parse(meta.sourceMap!)).toHaveProperty('version', 3)
    expect(meta.code).toContain('//# sourceURL=')
    expect(evaluator.evaluated.get(id)).not.toContain(SOURCEMAPPING_URL)
  })

  it('maps stack traces to the new lines after the module is invalidated', async ({
    runner,
    server,
  }) => {
    const before = await getError(async () => {
      const mod = await runner.import('/fixtures/throws-error-method.ts')
      mod.throwError()
    })
    expect(serializeStack(server, before)).toBe(
      '    at Module.throwError (<root>/fixtures/throws-error-method.ts:6:9)',
    )

    createFixtureEditor().editFile(
      throwsErrorMethod,
      (code) => '\n\n\n\n\n' + code + '\n',
    )
    const { moduleGraph } = server.environments.ssr
    moduleGraph.invalidateModule(moduleGraph.getModuleById(throwsErrorMethod)!)

    const after = await getError(async () => {
      const mod = await runner.import('/fixtures/throws-error-method.ts')
      mod.throwError()
    })
    expect(serializeStack(server, after)).toBe(
      '    at Module.throwError (<root>/fixtures/throws-error-method.ts:11:9)',
    )
  })

  it('inlines the map for runners that do not ask for it', async ({
    environment,
  }) => {
    const result = await environment.fetchModule(
      '/fixtures/throws-error-method.ts',
    )
    expect(result).not.toHaveProperty('sourceMap')
    expect(result).toHaveProperty(
      'code',
      expect.stringContaining(inlineMapComment),
    )
  })

  it('does not send a map inlined by an earlier fetch of the same module', async ({
    environment,
  }) => {
    const url = '/fixtures/throws-error-method.ts'
    const options = { separateSourceMap: true }
    const first = await environment.fetchModule(url, undefined, options)
    await environment.fetchModule(url)
    const afterInline = await environment.fetchModule(url, undefined, options)

    expect(afterInline).toHaveProperty('code', (first as ViteFetchResult).code)
    expect(afterInline).toHaveProperty(
      'sourceMap',
      (first as ViteFetchResult).sourceMap,
    )
  })

  it('keeps module code that mentions the inline map marker', async ({
    runner,
  }) => {
    const mod = await runner.import(
      '/fixtures/string-literal-sourcemap-source.ts',
    )
    expect(mod.getMessage()).toBe(MODULE_RUNNER_SOURCEMAPPING_SOURCE)
  })
})

describe('module runner with dev.sourcemapForDebugger disabled and the node interceptor', () => {
  const evaluator = new RecordingEvaluator()
  it.override({
    config: {
      environments: { ssr: { dev: { sourcemapForDebugger: false } } },
    },
    runnerOptions: { sourcemapInterceptor: 'node', evaluator },
  })

  it('keeps the map inlined because node reads it from the evaluated code', async ({
    runner,
  }) => {
    await runner.import('/fixtures/throws-error-method.ts')
    const meta = runner.evaluatedModules.getModuleById(throwsErrorMethod)!
      .meta as ViteFetchResult
    expect(meta).not.toHaveProperty('sourceMap')
    expect(evaluator.evaluated.get(throwsErrorMethod)).toContain(
      inlineMapComment,
    )
  })
})

describe('module runner with node:vm executor', () => {
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

  it.override({
    runnerOptions: {
      sourcemapInterceptor: 'prepareStackTrace',
      evaluator: new Evaluator(),
    },
  })

  it('should not crash when error stacktrace contains negative column', async ({
    runner,
  }) => {
    const error = await runner.import('/fixtures/a.ts').catch((err) => err)

    expect(() =>
      error.stack.includes('.stack access triggers the bug'),
    ).not.toThrow()
  })
})

describe('module runner interceptor with inline data: source map', () => {
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

  it.override({
    runnerOptions: {
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
  })

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
