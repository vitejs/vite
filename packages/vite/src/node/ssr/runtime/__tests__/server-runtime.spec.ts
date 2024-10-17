import { existsSync, readdirSync } from 'node:fs'
import { posix, win32 } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect } from 'vitest'
import { isWindows } from '../../../../shared/utils'
import { createModuleRunnerTester } from './utils'

const _URL = URL

describe('module runner initialization', async () => {
  const it = await createModuleRunnerTester()

  it('correctly runs ssr code', async ({ runner }) => {
    const mod = await runner.import('/fixtures/simple.js')
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

  it('can load virtual modules as an entry point', async ({ runner }) => {
    const mod = await runner.import('virtual:test')
    expect(mod.msg).toBe('virtual')
  })

  it('css is loaded correctly', async ({ runner }) => {
    const css = await runner.import('/fixtures/test.css')
    expect(css.default).toMatchInlineSnapshot(`
      ".test {
        color: red;
      }
      "
    `)
    const module = await runner.import('/fixtures/test.module.css')
    expect(module).toMatchObject({
      default: {
        test: expect.stringMatching(/^_test_/),
      },
      test: expect.stringMatching(/^_test_/),
    })
  })

  it('assets are loaded correctly', async ({ runner }) => {
    const assets = await runner.import('/fixtures/assets.js')
    expect(assets).toMatchObject({
      mov: '/fixtures/assets/placeholder.mov',
      txt: '/fixtures/assets/placeholder.txt',
      png: '/fixtures/assets/placeholder.png',
      webp: '/fixtures/assets/placeholder.webp',
    })
  })

  it('ids with Vite queries are loaded correctly', async ({ runner }) => {
    const raw = await runner.import('/fixtures/simple.js?raw')
    expect(raw.default).toMatchInlineSnapshot(`
      "export const test = 'I am initialized'

      import.meta.hot?.accept()
      "
    `)
    const url = await runner.import('/fixtures/simple.js?url')
    expect(url.default).toMatchInlineSnapshot(`"/fixtures/simple.js"`)
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
  }) => {
    const modSimple = await runner.import('/fixtures/simple.js')
    const modUrl = await runner.import('/fixtures/simple.js?url')
    expect(modSimple).not.toBe(modUrl)
    expect(modUrl.default).toBe('/fixtures/simple.js')
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
    } catch (e) {
      expect(e[s]).toBeUndefined()
      e[s] = true
      expect(e[s]).toBe(true)
    }

    try {
      await runner.import('/fixtures/has-error.js')
    } catch (e) {
      expect(e[s]).toBe(true)
    }
  })

  it('importing external cjs library checks exports', async ({ runner }) => {
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

  it('importing external esm library checks exports', async ({ runner }) => {
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

  it("dynamic import doesn't produce duplicates", async ({ runner }) => {
    const mod = await runner.import('/fixtures/dynamic-import.js')
    const modules = await mod.initialize()
    // toBe checks that objects are actually the same, not just structurally
    // using toEqual here would be a mistake because it check the structural difference
    expect(modules.static).toBe(modules.dynamicProcessed)
    expect(modules.static).toBe(modules.dynamicRelative)
    expect(modules.static).toBe(modules.dynamicAbsolute)
    expect(modules.static).toBe(modules.dynamicAbsoluteExtension)
    expect(modules.static).toBe(modules.dynamicAbsoluteFull)
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

  it('correctly resolves module url', async ({ runner, server }) => {
    const { meta } = await runner.import('/fixtures/basic')
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
  }) => {
    // entry.js ⇔ entry-cyclic.js
    //   ⇓
    // action.js
    const mod = await runner.import('/fixtures/cyclic/entry')
    await mod.setupCyclic()
    const action = await mod.importAction('/fixtures/cyclic/action')
    expect(action).toBeDefined()
  })

  it('this of the exported function should be undefined', async ({
    runner,
  }) => {
    const mod = await runner.import('/fixtures/no-this/importer.js')
    expect(mod.result).toBe(undefined)
  })
})

describe('optimize-deps', async () => {
  const it = await createModuleRunnerTester({
    cacheDir: 'node_modules/.vite-test',
    ssr: {
      noExternal: true,
      optimizeDeps: {
        include: ['@vitejs/cjs-external'],
      },
    },
  })

  it('optimized dep as entry', async ({ runner }) => {
    const mod = await runner.import('@vitejs/cjs-external')
    expect(mod.default.hello()).toMatchInlineSnapshot(`"world"`)
  })
})
