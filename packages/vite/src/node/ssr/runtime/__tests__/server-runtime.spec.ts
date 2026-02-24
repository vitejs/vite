import { existsSync, readdirSync } from 'node:fs'
import { posix, win32 } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, vi } from 'vitest'
import { isWindows } from '../../../../shared/utils'
import type { ExternalFetchResult } from '../../../../shared/invokeMethods'
import { runnerTest as it } from './utils'

const _URL = URL

describe('module runner initialization', async () => {
  it.scoped({
    config: {
      resolve: {
        external: ['tinyglobby'],
      },
      experimental: {
        ssrBundledDev: true,
      },
      build: {
        rolldownOptions: {
          input: [
            './fixtures/dynamic-import.js',
            './fixtures/simple.js',
            './fixtures/test.css',
            './fixtures/test.module.css',
            './fixtures/assets.js',
            './fixtures/top-level-object.js',
            './fixtures/cyclic2/test9/index.js',
            './fixtures/live-binding/test4/index.js',
            './fixtures/live-binding/test3/index.js',
            './fixtures/live-binding/test2/index.js',
            './fixtures/live-binding/test1/index.js',
            './fixtures/execution-order-re-export/index.js',
            './fixtures/cyclic2/test7/Ion.js',
            './fixtures/cyclic2/test6/index.js',
            './fixtures/cyclic2/test5/index.js',
            './fixtures/cyclic2/test4/index.js',
            './fixtures/cyclic2/test3/index.js',
            './fixtures/cyclic2/test2/index.js',
            './fixtures/cyclic2/test1/index.js',
            './fixtures/no-this/importer.js',
            './fixtures/native.js',
            './fixtures/installed.js',
            './fixtures/virtual.js',
            './fixtures/cyclic/entry.js',
            './fixtures/has-error.js',
            './fixtures/basic.js',
            './fixtures/simple.js?raw',
            './fixtures/simple.js?url',
            './fixtures/test.css?inline',
            // TODO: this fails during bundle, not at runtime
            // at the moment it HANGS the whole process
            // './fixtures/esm-external-non-existing.js',
            // './fixtures/cjs-external-non-existing.js',
          ],
        },
      },
    },
  })

  it('correctly runs ssr code', async ({ runner }) => {
    const mod = await runner.import('./fixtures/simple.js')
    expect(mod.test).toEqual('I am initialized')

    // loads the same module if id is a file url
    const fileUrl = new _URL('./fixtures/simple.js', import.meta.url)
    const mod2 = await runner.import(fileUrl.toString())
    expect(mod).toBe(mod2)

    // loads the same module if id is a file path
    const filePath = fileURLToPath(fileUrl)
    const mod3 = await runner.import(filePath)
    expect(mod).toBe(mod3)
  })

  it('can load virtual modules as an entry point', async ({
    runner,
    skip,
    config,
  }) => {
    skip(!!config.experimental?.ssrBundledDev, 'FBM')

    const mod = await runner.import('virtual:test')
    expect(mod.msg).toBe('virtual')

    // already resolved id works similar to `transformRequest`
    expect(await runner.import(`\0virtual:normal`)).toMatchInlineSnapshot(`
      {
        "default": "ok",
      }
    `)

    // escaped virtual module id works
    expect(await runner.import(`/@id/__x00__virtual:normal`))
      .toMatchInlineSnapshot(`
      {
        "default": "ok",
      }
    `)

    // timestamp query works
    expect(await runner.import(`virtual:normal?t=${Date.now()}`))
      .toMatchInlineSnapshot(`
      {
        "default": "ok",
      }
    `)

    // other arbitrary queries don't work
    await expect(() =>
      runner.import('virtual:normal?abcd=1234'),
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        'Failed to load url virtual:normal?abcd=1234',
      ),
    })
  })

  it('css is loaded correctly', async ({ runner }) => {
    const css = await runner.import('/fixtures/test.css')
    expect(css.default).toBe(undefined)
    const module = await runner.import('/fixtures/test.module.css')
    expect(module).toMatchObject({
      default: {
        test: expect.stringMatching(/^_test_/),
      },
      test: expect.stringMatching(/^_test_/),
    })
  })

  it('assets are loaded correctly', async ({ runner, config }) => {
    const assets = await runner.import('/fixtures/assets.js')
    if (config.experimental?.ssrBundledDev) {
      expect(assets).toMatchObject({
        mov: 'data:video/quicktime;base64,',
        txt: 'data:text/plain;base64,',
        png: 'data:image/png;base64,',
        webp: 'data:image/webp;base64,',
      })
    } else {
      expect(assets).toMatchObject({
        mov: '/fixtures/assets/placeholder.mov',
        txt: '/fixtures/assets/placeholder.txt',
        png: '/fixtures/assets/placeholder.png',
        webp: '/fixtures/assets/placeholder.webp',
      })
    }
  })

  it('ids with Vite queries are loaded correctly', async ({
    runner,
    config,
  }) => {
    const raw = await runner.import('/fixtures/simple.js?raw')
    expect(raw.default).toMatchInlineSnapshot(`
      "export const test = 'I am initialized'

      import.meta.hot?.accept()
      "
    `)
    const url = await runner.import('/fixtures/simple.js?url')
    if (config.experimental?.ssrBundledDev) {
      expect(url.default).toMatch('__VITE_ASSET__')
    } else {
      expect(url.default).toMatchInlineSnapshot(`"/fixtures/simple.js"`)
    }
    const inline = await runner.import('/fixtures/test.css?inline')
    expect(inline.default).toMatchInlineSnapshot(`
      ".test {
        color: red;
      }
      "
    `)
  })

  it('modules with query strings are treated as different modules', async ({
    runner,
    config,
  }) => {
    const modSimple = await runner.import('/fixtures/simple.js')
    const modUrl = await runner.import('/fixtures/simple.js?url')
    expect(modSimple).not.toBe(modUrl)
    if (config.experimental?.ssrBundledDev) {
      expect(modUrl.default).toContain('__VITE_ASSET__')
    } else {
      expect(modUrl.default).toBe('/fixtures/simple.js')
    }
  })

  it('exports is not modifiable', async ({ runner }) => {
    const mod = await runner.import('/fixtures/simple.js')
    expect(Object.isSealed(mod)).toBe(true)
    expect(() => {
      mod.test = 'I am modified'
    }).toThrowErrorMatchingInlineSnapshot(
      `[TypeError: Cannot set property test of [object Module] which has only a getter]`,
    )
    expect(() => {
      delete mod.test
    }).toThrowErrorMatchingInlineSnapshot(
      `[TypeError: Cannot delete property 'test' of [object Module]]`,
    )
    expect(() => {
      Object.defineProperty(mod, 'test', { value: 'I am modified' })
    }).toThrowErrorMatchingInlineSnapshot(
      `[TypeError: Cannot redefine property: test]`,
    )
    expect(() => {
      mod.other = 'I am added'
    }).toThrowErrorMatchingInlineSnapshot(
      `[TypeError: Cannot add property other, object is not extensible]`,
    )
  })

  it('throws the same error', async ({ runner }) => {
    expect.assertions(3)
    const s = Symbol()
    try {
      await runner.import('/fixtures/has-error.js')
    } catch (e: any) {
      expect(e[s]).toBeUndefined()
      e[s] = true
      expect(e[s]).toBe(true)
    }

    try {
      await runner.import('/fixtures/has-error.js')
    } catch (e: any) {
      expect(e[s]).toBe(true)
    }
  })

  // if bundle throws an error, we should stopn waiting
  it('importing external cjs library checks exports', async ({
    runner,
    skip,
    config,
  }) => {
    skip(!!config.experimental?.ssrBundledDev, 'FBM')

    await expect(() => runner.import('/fixtures/cjs-external-non-existing.js'))
      .rejects.toThrowErrorMatchingInlineSnapshot(`
      [SyntaxError: [vite] Named export 'nonExisting' not found. The requested module '@vitejs/cjs-external' is a CommonJS module, which may not support all module.exports as named exports.
      CommonJS modules can always be imported via the default export, for example using:

      import pkg from '@vitejs/cjs-external';
      const {nonExisting} = pkg;
      ]
    `)
    // subsequent imports of the same external package should not throw if imports are correct
    await expect(
      runner.import('/fixtures/cjs-external-existing.js'),
    ).resolves.toMatchObject({
      result: 'world',
    })
  })

  it('importing external esm library checks exports', async ({
    runner,
    skip,
    config,
  }) => {
    skip(!!config.experimental?.ssrBundledDev, 'FBM')

    await expect(() =>
      runner.import('/fixtures/esm-external-non-existing.js'),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[SyntaxError: [vite] The requested module '@vitejs/esm-external' does not provide an export named 'nonExisting']`,
    )
    // subsequent imports of the same external package should not throw if imports are correct
    await expect(
      runner.import('/fixtures/esm-external-existing.js'),
    ).resolves.toMatchObject({
      result: 'world',
    })
  })

  it("dynamic import doesn't produce duplicates", async ({
    config,
    skip,
    runner,
  }) => {
    // rolldown doesn't return the same reference and doesn't support non-processed dynamic imports
    skip(!!config.experimental?.ssrBundledDev, 'FBM')

    const mod = await runner.import('./fixtures/dynamic-import.js')
    const modules = await mod.initialize()
    // toBe checks that objects are actually the same, not just structurally
    // using toEqual here would be a mistake because it check the structural difference
    expect(modules.static).toBe(modules.dynamicProcessed)
    expect(modules.static).toBe(modules.dynamicRelative)
    expect(modules.static).toBe(modules.dynamicAbsolute)
    expect(modules.static).toBe(modules.dynamicAbsoluteExtension)
    expect(modules.static).toBe(modules.dynamicAbsoluteFull)
    expect(modules.static).toBe(modules.dynamicFileUrl)
  })

  it('dynamic imports in FBM', async ({ config, skip, runner }) => {
    skip(!config.experimental?.ssrBundledDev, 'FBM')

    const mod = await runner.import('./fixtures/dynamic-import.js')
    const modules = await mod.initialize(true)

    expect(modules.static.test).toBeTypeOf('string')
    expect(modules.dynamicProcessed.test).toBeTypeOf('string')
    expect(modules.dynamicProcessed.test).toBe(modules.static.test)
  })

  it('correctly imports a virtual module', async ({ runner }) => {
    const mod = await runner.import('/fixtures/virtual.js')
    expect(mod.msg0).toBe('virtual0')
    expect(mod.msg).toBe('virtual')
  })

  it('importing package from node_modules', async ({ runner }) => {
    const mod = (await runner.import(
      '/fixtures/installed.js',
    )) as typeof import('tinyspy')
    const fn = mod.spy()
    fn()
    expect(fn.called).toBe(true)
  })

  it('importing native node package', async ({ runner }) => {
    const mod = await runner.import('/fixtures/native.js')
    expect(mod.readdirSync).toBe(readdirSync)
    expect(mod.existsSync).toBe(existsSync)
  })

  // files are virtual, so url is not defined
  it('correctly resolves module url', async ({
    runner,
    server,
    config,
    skip,
  }) => {
    skip(!!config.experimental?.ssrBundledDev, 'FBM')

    const { meta } = await runner.import('/fixtures/basic.js')
    const basicUrl = new _URL('./fixtures/basic.js', import.meta.url).toString()
    expect(meta.url).toBe(basicUrl)

    const filename = meta.filename!
    const dirname = meta.dirname!

    if (isWindows) {
      const cwd = process.cwd()
      const drive = `${cwd[0].toUpperCase()}:\\`
      const root = server.config.root.replace(/\\/g, '/')

      expect(filename.startsWith(drive)).toBe(true)
      expect(dirname.startsWith(drive)).toBe(true)

      expect(filename).toBe(win32.join(root, '.\\fixtures\\basic.js'))
      expect(dirname).toBe(win32.join(root, '.\\fixtures'))
    } else {
      const root = server.config.root

      expect(posix.join(root, './fixtures/basic.js')).toBe(filename)
      expect(posix.join(root, './fixtures')).toBe(dirname)
    }
  })

  it(`no maximum call stack error ModuleRunner.isCircularImport`, async ({
    runner,
    skip,
    config,
  }) => {
    skip(!!config.experimental?.ssrBundledDev, 'FBM')

    // entry.js ⇔ entry-cyclic.js
    //   ⇓
    // action.js
    const mod = await runner.import('./fixtures/cyclic/entry.js')
    await mod.setupCyclic()
    // TODO(FBM): Importing dynamically is not supported yet
    const action = await mod.importAction('/fixtures/cyclic/action')
    expect(action).toBeDefined()
  })

  it('this of the exported function should be undefined', async ({
    runner,
  }) => {
    const mod = await runner.import('/fixtures/no-this/importer.js')
    expect(mod.result).toBe(undefined)
  })

  it.for([
    '/fixtures/cyclic2/test1/index.js',
    '/fixtures/cyclic2/test2/index.js',
    '/fixtures/cyclic2/test3/index.js',
    '/fixtures/cyclic2/test4/index.js',
  ] as const)(`cyclic %s`, async (entry, { runner }) => {
    const mod = await runner.import(entry)
    expect({ ...mod }).toEqual({
      dep1: {
        ok: true,
      },
      dep2: {
        ok: true,
      },
    })
  })

  it(`cyclic invalid 1`, async ({ runner, config }) => {
    // Node also fails but with a different message
    //   $ node packages/vite/src/node/ssr/runtime/__tests__/fixtures/cyclic2/test5/index.js
    //   ReferenceError: Cannot access 'dep1' before initialization
    if (config.experimental?.ssrBundledDev) {
      await expect(() =>
        runner.import('/fixtures/cyclic2/test5/index.js'),
      ).rejects.toMatchInlineSnapshot(
        `[ReferenceError: Cannot access 'dep1' before initialization]`,
      )
    } else {
      await expect(() =>
        runner.import('/fixtures/cyclic2/test5/index.js'),
      ).rejects.toMatchInlineSnapshot(
        `[TypeError: Cannot read properties of undefined (reading 'ok')]`,
      )
    }
  })

  // rolldown doesn't support this
  // - Cannot access 'dep1' before initialization
  it(`cyclic invalid 2`, async ({ runner, skip, config }) => {
    skip(!!config.experimental?.ssrBundledDev, 'FBM')

    // It should be an error but currently `undefined` fallback.
    expect(
      await runner.import('/fixtures/cyclic2/test6/index.js'),
    ).toMatchInlineSnapshot(
      `
      {
        "dep1": "dep1: dep2: undefined",
      }
    `,
    )
  })

  it(`cyclic with mixed import and re-export`, async ({ runner }) => {
    const mod = await runner.import('/fixtures/cyclic2/test7/Ion.js')
    expect(mod).toMatchInlineSnapshot(`
      {
        "IonTypes": {
          "BLOB": "Blob",
        },
        "dom": {
          "Blob": "Blob",
        },
      }
    `)
  })

  it(`execution order with mixed import and re-export`, async ({
    runner,
    onTestFinished,
  }) => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    onTestFinished(() => spy.mockRestore())

    await runner.import('/fixtures/execution-order-re-export/index.js')
    expect(spy.mock.calls.map((v) => v[0])).toMatchInlineSnapshot(`
      [
        "dep1",
        "dep2",
      ]
    `)
  })

  it(`live binding (export default function f)`, async ({ runner }) => {
    const mod = await runner.import('/fixtures/live-binding/test1/index.js')
    expect(mod.default).toMatchInlineSnapshot(`
      [
        2,
        3,
      ]
    `)
  })

  it(`live binding (export default f)`, async ({ runner }) => {
    const mod = await runner.import('/fixtures/live-binding/test2/index.js')
    expect(mod.default).toMatchInlineSnapshot(`
      [
        1,
        1,
      ]
    `)
  })

  it(`live binding (export { f as default })`, async ({ runner }) => {
    const mod = await runner.import('/fixtures/live-binding/test3/index.js')
    expect(mod.default).toMatchInlineSnapshot(`
      [
        2,
        3,
      ]
    `)
  })

  it(`live binding (export default class C)`, async ({ runner }) => {
    const mod = await runner.import('/fixtures/live-binding/test4/index.js')
    expect(mod.default).toMatchInlineSnapshot(`
      [
        2,
        3,
      ]
    `)
  })

  it(`export default getter is hoisted`, async ({ runner }) => {
    // Node error is `ReferenceError: Cannot access 'dep' before initialization`
    // It should be an error but currently `undefined` fallback.
    expect(
      await runner.import('/fixtures/cyclic2/test9/index.js'),
    ).toMatchInlineSnapshot(
      `
      {
        "default": undefined,
      }
    `,
    )
  })

  it(`handle Object variable`, async ({ runner }) => {
    const mod = await runner.import('/fixtures/top-level-object.js')
    expect(mod).toMatchInlineSnapshot(`
      {
        "Object": "my-object",
      }
    `)
  })
})

describe('optimize-deps', async () => {
  it.scoped({
    config: {
      cacheDir: 'node_modules/.vite-test',
      ssr: {
        noExternal: true,
        optimizeDeps: {
          include: ['@vitejs/cjs-external'],
        },
      },
    },
  })

  it('optimized dep as entry', async ({ runner }) => {
    const mod = await runner.import('@vitejs/cjs-external')
    expect(mod.default.hello()).toMatchInlineSnapshot(`"world"`)
  })
})

describe('resolveId absolute path entry', async () => {
  it.scoped({
    config: {
      plugins: [
        {
          name: 'test-resolevId',
          enforce: 'pre',
          resolveId(source) {
            if (
              source ===
              posix.join(this.environment.config.root, 'fixtures/basic.js')
            ) {
              return '\0virtual:basic'
            }
          },
          load(id) {
            if (id === '\0virtual:basic') {
              return `export const name = "virtual:basic"`
            }
          },
        },
      ],
    },
  })

  it('ssrLoadModule', async ({ server }) => {
    const mod = await server.ssrLoadModule(
      posix.join(server.config.root, 'fixtures/basic.js'),
    )
    expect(mod.name).toMatchInlineSnapshot(`"virtual:basic"`)
  })

  it('runner', async ({ server, runner }) => {
    const mod = await runner.import(
      posix.join(server.config.root, 'fixtures/basic.js'),
    )
    expect(mod.name).toMatchInlineSnapshot(`"virtual:basic"`)
  })
})

describe('virtual module hmr', async () => {
  let state = 'init'

  it.scoped({
    config: {
      server: {
        hmr: true,
      },
      plugins: [
        {
          name: 'test-resolevId',
          enforce: 'pre',
          resolveId(source) {
            if (source === 'virtual:test') {
              return '\0' + source
            }
          },
          load(id) {
            if (id === '\0virtual:test') {
              return `export default ${JSON.stringify(state)}`
            }
          },
        },
      ],
    },
  })

  it('full reload', async ({ environment, runner }) => {
    const mod = await runner.import('virtual:test')
    expect(mod.default).toBe('init')
    state = 'reloaded'
    environment.moduleGraph.invalidateAll()
    environment.hot.send({ type: 'full-reload' })
    await vi.waitFor(() => {
      const mod = runner.evaluatedModules.getModuleById('\0virtual:test')
      expect(mod?.exports.default).toBe('reloaded')
    })
  })

  it("the external module's ID and file are resolved correctly", async ({
    server,
    runner,
  }) => {
    await runner.import(
      posix.join(server.config.root, 'fixtures/import-external.ts'),
    )
    const moduleNode = runner.evaluatedModules.getModuleByUrl('tinyglobby')!
    const meta = moduleNode.meta as ExternalFetchResult
    if (process.platform === 'win32') {
      expect(meta.externalize).toMatch(/^file:\/\/\/\w:\//) // file:///C:/
      expect(moduleNode.id).toMatch(/^\w:\//) // C:/
      expect(moduleNode.file).toMatch(/^\w:\//) // C:/
    } else {
      expect(meta.externalize).toMatch(/^file:\/\/\//) // file:///
      expect(moduleNode.id).toMatch(/^\//) // /
      expect(moduleNode.file).toMatch(/^\//) // /
    }
  })
})

describe('invalid package', async () => {
  it.scoped({
    config: {
      environments: {
        ssr: {
          resolve: {
            noExternal: true,
          },
        },
      },
    },
  })

  it('can catch resolve error on runtime', async ({ runner }) => {
    const mod = await runner.import('./fixtures/invalid-package/test.js')
    expect(await mod.test()).toMatchInlineSnapshot(`
      {
        "data": [Error: Failed to resolve entry for package "test-dep-invalid-exports". The package may have incorrect main/module/exports specified in its package.json.],
        "ok": false,
      }
    `)
  })
})
