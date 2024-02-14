import { existsSync, readdirSync } from 'node:fs'
import { posix, win32 } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect } from 'vitest'
import { isWindows } from '../utils'
import { createViteRuntimeTester } from './utils'

const _URL = URL

describe('vite-runtime initialization', async () => {
  const it = await createViteRuntimeTester()

  it('correctly runs ssr code', async ({ runtime }) => {
    const mod = await runtime.executeUrl('/fixtures/simple.js')
    expect(mod.test).toEqual('I am initialized')

    // loads the same module if id is a file url
    const fileUrl = new _URL('./fixtures/simple.js', import.meta.url)
    const mod2 = await runtime.executeUrl(fileUrl.toString())
    expect(mod).toBe(mod2)

    // loads the same module if id is a file path
    const filePath = fileURLToPath(fileUrl)
    const mod3 = await runtime.executeUrl(filePath)
    expect(mod).toBe(mod3)
  })

  it('can load virtual modules as an entry point', async ({ runtime }) => {
    const mod = await runtime.executeEntrypoint('virtual:test')
    expect(mod.msg).toBe('virtual')
  })

  it('css is loaded correctly', async ({ runtime }) => {
    const css = await runtime.executeUrl('/fixtures/test.css')
    expect(css.default).toMatchInlineSnapshot(`
      ".test {
        color: red;
      }
      "
    `)
    const module = await runtime.executeUrl('/fixtures/test.module.css')
    expect(module).toMatchObject({
      default: {
        test: expect.stringMatching(/^_test_/),
      },
      test: expect.stringMatching(/^_test_/),
    })
  })

  it('assets are loaded correctly', async ({ runtime }) => {
    const assets = await runtime.executeUrl('/fixtures/assets.js')
    expect(assets).toMatchObject({
      mov: '/fixtures/assets/placeholder.mov',
      txt: '/fixtures/assets/placeholder.txt',
      png: '/fixtures/assets/placeholder.png',
      webp: '/fixtures/assets/placeholder.webp',
    })
  })

  it('ids with Vite queries are loaded correctly', async ({ runtime }) => {
    const raw = await runtime.executeUrl('/fixtures/simple.js?raw')
    expect(raw.default).toMatchInlineSnapshot(`
      "export const test = 'I am initialized'

      import.meta.hot?.accept()
      "
    `)
    const url = await runtime.executeUrl('/fixtures/simple.js?url')
    expect(url.default).toMatchInlineSnapshot(`"/fixtures/simple.js"`)
    const inline = await runtime.executeUrl('/fixtures/test.css?inline')
    expect(inline.default).toMatchInlineSnapshot(`
      ".test {
        color: red;
      }
      "
    `)
  })

  it('modules with query strings are treated as different modules', async ({
    runtime,
  }) => {
    const modSimple = await runtime.executeUrl('/fixtures/simple.js')
    const modUrl = await runtime.executeUrl('/fixtures/simple.js?url')
    expect(modSimple).not.toBe(modUrl)
    expect(modUrl.default).toBe('/fixtures/simple.js')
  })

  it('exports is not modifiable', async ({ runtime }) => {
    const mod = await runtime.executeUrl('/fixtures/simple.js')
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

  it('throws the same error', async ({ runtime }) => {
    expect.assertions(3)
    const s = Symbol()
    try {
      await runtime.executeUrl('/fixtures/has-error.js')
    } catch (e) {
      expect(e[s]).toBeUndefined()
      e[s] = true
      expect(e[s]).toBe(true)
    }

    try {
      await runtime.executeUrl('/fixtures/has-error.js')
    } catch (e) {
      expect(e[s]).toBe(true)
    }
  })

  it('importing external cjs library checks exports', async ({ runtime }) => {
    await expect(() =>
      runtime.executeUrl('/fixtures/cjs-external-non-existing.js'),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      [SyntaxError: [vite] Named export 'nonExisting' not found. The requested module '@vitejs/cjs-external' is a CommonJS module, which may not support all module.exports as named exports.
      CommonJS modules can always be imported via the default export, for example using:

      import pkg from '@vitejs/cjs-external';
      const {nonExisting} = pkg;
      ]
    `)
    // subsequent imports of the same external package should not throw if imports are correct
    await expect(
      runtime.executeUrl('/fixtures/cjs-external-existing.js'),
    ).resolves.toMatchObject({
      result: 'world',
    })
  })

  it('importing external esm library checks exports', async ({ runtime }) => {
    await expect(() =>
      runtime.executeUrl('/fixtures/esm-external-non-existing.js'),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[SyntaxError: [vite] The requested module '@vitejs/esm-external' does not provide an export named 'nonExisting']`,
    )
    // subsequent imports of the same external package should not throw if imports are correct
    await expect(
      runtime.executeUrl('/fixtures/esm-external-existing.js'),
    ).resolves.toMatchObject({
      result: 'world',
    })
  })

  it("dynamic import doesn't produce duplicates", async ({ runtime }) => {
    const mod = await runtime.executeUrl('/fixtures/dynamic-import.js')
    const modules = await mod.initialize()
    // toBe checks that objects are actually the same, not just structually
    // using toEqual here would be a mistake because it chesk the structural difference
    expect(modules.static).toBe(modules.dynamicProcessed)
    expect(modules.static).toBe(modules.dynamicRelative)
    expect(modules.static).toBe(modules.dynamicAbsolute)
    expect(modules.static).toBe(modules.dynamicAbsoluteExtension)
  })

  it('correctly imports a virtual module', async ({ runtime }) => {
    const mod = await runtime.executeUrl('/fixtures/virtual.js')
    expect(mod.msg0).toBe('virtual0')
    expect(mod.msg).toBe('virtual')
  })

  it('importing package from node_modules', async ({ runtime }) => {
    const mod = (await runtime.executeUrl(
      '/fixtures/installed.js',
    )) as typeof import('tinyspy')
    const fn = mod.spy()
    fn()
    expect(fn.called).toBe(true)
  })

  it('importing native node package', async ({ runtime }) => {
    const mod = await runtime.executeUrl('/fixtures/native.js')
    expect(mod.readdirSync).toBe(readdirSync)
    expect(mod.existsSync).toBe(existsSync)
  })

  it('correctly resolves module url', async ({ runtime, server }) => {
    const { meta } =
      await runtime.executeUrl<typeof import('./fixtures/basic')>(
        '/fixtures/basic',
      )
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
})
