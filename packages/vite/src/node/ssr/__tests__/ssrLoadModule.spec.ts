import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { stripVTControlCharacters } from 'node:util'
import { expect, test } from 'vitest'
import { createServer } from '../../server'
import { normalizePath } from '../../utils'

const root = fileURLToPath(new URL('./', import.meta.url))

async function createDevServer() {
  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'silent',
    optimizeDeps: {
      noDiscovery: true,
    },
  })
  server.pluginContainer.buildStart({})
  return server
}

test('ssrLoad', async () => {
  expect.assertions(1)
  const server = await createDevServer()
  const moduleRelativePath = '/fixtures/modules/has-invalid-import.js'
  const moduleAbsolutePath = normalizePath(path.join(root, moduleRelativePath))
  try {
    await server.ssrLoadModule(moduleRelativePath)
  } catch (e) {
    expect(e.message).toBe(
      `Failed to load url ./non-existent.js (resolved id: ./non-existent.js) in ${moduleAbsolutePath}. Does the file exist?`,
    )
  }
})

test('error has same instance', async () => {
  expect.assertions(3)
  const s = Symbol()

  const server = await createDevServer()
  try {
    await server.ssrLoadModule('/fixtures/modules/has-error.js')
  } catch (e) {
    expect(e[s]).toBeUndefined()
    e[s] = true
    expect(e[s]).toBe(true)
  }

  try {
    await server.ssrLoadModule('/fixtures/modules/has-error.js')
  } catch (e) {
    expect(e[s]).toBe(true)
  }
})

test('import.meta.filename/dirname returns same value with Node', async () => {
  const server = await createDevServer()
  const moduleRelativePath = '/fixtures/modules/import-meta.js'
  const filename = path.resolve(root, '.' + moduleRelativePath)

  const viteValue = await server.ssrLoadModule(moduleRelativePath)
  expect(viteValue.dirname).toBe(path.dirname(filename))
  expect(viteValue.filename).toBe(filename)
})

test('virtual module invalidation simple', async () => {
  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'silent',
    optimizeDeps: {
      noDiscovery: true,
    },
    plugins: [
      {
        name: 'virtual-test',
        resolveId(id) {
          if (id === 'virtual:test') {
            return '\0virtual:test'
          }
        },
        load(id) {
          if (id === '\0virtual:test') {
            return `
              globalThis.__virtual_test_state ??= 0;
              globalThis.__virtual_test_state++;
              export default globalThis.__virtual_test_state;
            `
          }
        },
      },
    ],
  })
  await server.pluginContainer.buildStart({})

  const mod1 = await server.ssrLoadModule('virtual:test')
  expect(mod1.default).toEqual(1)
  const mod2 = await server.ssrLoadModule('virtual:test')
  expect(mod2.default).toEqual(1)

  const modNode = server.moduleGraph.getModuleById('\0virtual:test')
  server.moduleGraph.invalidateModule(modNode!)

  const mod3 = await server.ssrLoadModule('virtual:test')
  expect(mod3.default).toEqual(2)
})

test('virtual module invalidation nested', async () => {
  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'silent',
    optimizeDeps: {
      noDiscovery: true,
    },
    plugins: [
      {
        name: 'test-virtual',
        resolveId(id) {
          if (id === 'virtual:test') {
            return '\0virtual:test'
          }
        },
        load(id) {
          if (id === '\0virtual:test') {
            return `
              import testDep from "virtual:test-dep";
              export default testDep;
            `
          }
        },
      },
      {
        name: 'test-virtual-dep',
        resolveId(id) {
          if (id === 'virtual:test-dep') {
            return '\0virtual:test-dep'
          }
        },
        load(id) {
          if (id === '\0virtual:test-dep') {
            return `
              globalThis.__virtual_test_state2 ??= 0;
              globalThis.__virtual_test_state2++;
              export default globalThis.__virtual_test_state2;
            `
          }
        },
      },
    ],
  })
  await server.pluginContainer.buildStart({})

  const mod1 = await server.ssrLoadModule('virtual:test')
  expect(mod1.default).toEqual(1)
  const mod2 = await server.ssrLoadModule('virtual:test')
  expect(mod2.default).toEqual(1)

  server.moduleGraph.invalidateModule(
    server.moduleGraph.getModuleById('\0virtual:test')!,
  )
  server.moduleGraph.invalidateModule(
    server.moduleGraph.getModuleById('\0virtual:test-dep')!,
  )

  const mod3 = await server.ssrLoadModule('virtual:test')
  expect(mod3.default).toEqual(2)
})

test('can export global', async () => {
  const server = await createDevServer()
  const mod = await server.ssrLoadModule('/fixtures/global/export.js')
  expect(mod.global).toBe('ok')
})

test('can access nodejs global', async () => {
  const server = await createDevServer()
  const mod = await server.ssrLoadModule('/fixtures/global/test.js')
  expect(mod.default).toBe(globalThis)
})

test('parse error', async () => {
  const server = await createDevServer()

  function stripRoot(s?: string) {
    return (s || '').replace(server.config.root, '<root>')
  }

  for (const file of [
    '/fixtures/errors/syntax-error.ts',
    '/fixtures/errors/syntax-error.js',
    '/fixtures/errors/syntax-error-dep.ts',
    '/fixtures/errors/syntax-error-dep.js',
  ]) {
    try {
      await server.ssrLoadModule(file)
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
      expect({
        message: stripRoot(e.message),
        frame: stripVTControlCharacters(e.frame || ''),
        id: stripRoot(e.id),
        loc: e.loc && {
          file: stripRoot(e.loc.file),
          column: e.loc.column,
          line: e.loc.line,
        },
      }).toMatchSnapshot()
      continue
    }
    expect.unreachable()
  }
})

test('json', async () => {
  const server = await createDevServer()
  const mod = await server.ssrLoadModule('/fixtures/json/test.json')
  expect(mod).toMatchInlineSnapshot(`
    {
      "default": {
        "hello": "this is json",
      },
      "hello": "this is json",
    }
  `)

  const source = fs.readFileSync(
    path.join(root, 'fixtures/json/test.json'),
    'utf-8',
  )
  const json = await server.ssrTransform(
    `export default ${source}`,
    null,
    '/test.json',
  )
  expect(json?.code.length).toMatchInlineSnapshot(`61`)
})
