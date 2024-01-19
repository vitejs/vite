import { existsSync, readdirSync } from 'node:fs'
import { posix, win32 } from 'node:path'
import { describe, expect } from 'vitest'
import { isWindows } from '../utils'
import { createViteRuntimeTester } from './utils'

describe('vite-runtime initialization', async () => {
  const it = await createViteRuntimeTester()

  it('correctly runs ssr code', async ({ runtime }) => {
    const mod = await runtime.executeUrl('/fixtures/simple.js')
    expect(mod.test).toEqual('I am initialized')
  })

  it('exports is not modifiable', async ({ runtime }) => {
    const mod = await runtime.executeUrl('/fixtures/simple.js')
    expect(() => {
      mod.test = 'I am modified'
    }).toThrowErrorMatchingInlineSnapshot(
      `[TypeError: Cannot set property test of [object Module] which has only a getter]`,
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
    // so it isn't transformed by Vitest
    const _URL = URL
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
