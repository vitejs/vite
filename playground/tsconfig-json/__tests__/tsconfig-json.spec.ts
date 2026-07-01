import path from 'node:path'
import fs from 'node:fs'
import { transformWithEsbuild } from 'vite'
import { describe, expect, test } from 'vitest'
import {
  browserLogs,
  editFile,
  isServe,
  page,
  serverLogs,
  viteTestUrl,
} from '~utils'

test('should respected each `tsconfig.json`s compilerOptions', () => {
  // main side effect should be called (because of `"verbatimModuleSyntax": true`)
  expect(browserLogs).toContain('main side effect')
  // main base setter should not be called (because of `"useDefineForClassFields": true"`)
  expect(browserLogs).not.toContain('data setter in MainBase')

  // nested side effect should not be called (because "verbatimModuleSyntax" is not set, defaults to false)
  expect(browserLogs).not.toContain('nested side effect')
  // nested base setter should be called (because of `"useDefineForClassFields": false"`)
  expect(browserLogs).toContain('data setter in NestedBase')

  // nested-with-extends side effect should be called (because "verbatimModuleSyntax" is extended from the main tsconfig.json, which is true)
  expect(browserLogs).toContain('nested-with-extends side effect')
  // nested-with-extends base setter should be called (because of `"useDefineForClassFields": false"`)
  expect(browserLogs).toContain('data setter in NestedWithExtendsBase')
})

test.runIf(isServe)(
  'nested tsconfig update: only affected modules are re-transformed',
  async () => {
    const before = (await fetch(viteTestUrl + '/transform-counts').then((r) =>
      r.json(),
    )) as Record<string, number>

    // both zones should have been transformed on initial load
    expect(before['nested/main.ts']).toBeGreaterThan(0)
    expect(before['nested-with-extends/main.ts']).toBeGreaterThan(0)

    editFile('nested/tsconfig.json', (code) =>
      code.replace(
        '"useDefineForClassFields": false',
        '"useDefineForClassFields": true',
      ),
    )
    await page.waitForEvent('load')

    const after = (await fetch(viteTestUrl + '/transform-counts').then((r) =>
      r.json(),
    )) as Record<string, number>

    // nested modules should have been re-transformed (tsconfig changed)
    expect(after['nested/main.ts']).toBeGreaterThan(before['nested/main.ts'])

    // nested-with-extends is in a separate tsconfig zone and not in nested/'s
    // import chain, so it should NOT be re-transformed
    expect(after['nested-with-extends/main.ts']).toBe(
      before['nested-with-extends/main.ts'],
    )

    // restore
    editFile('nested/tsconfig.json', (code) =>
      code.replace(
        '"useDefineForClassFields": true',
        '"useDefineForClassFields": false',
      ),
    )
    await page.waitForEvent('load')
  },
)

test.runIf(isServe)('scanner should not error with decorators', () => {
  expect(serverLogs).not.toStrictEqual(
    expect.arrayContaining([
      expect.stringContaining(
        'Parameter decorators only work when experimental decorators are enabled',
      ),
    ]),
  )
})

describe('transformWithEsbuild', () => {
  test('merge tsconfigRaw object', async () => {
    const main = path.resolve(import.meta.dirname, '../src/main.ts')
    const mainContent = fs.readFileSync(main, 'utf-8')
    const result = await transformWithEsbuild(mainContent, main, {
      tsconfigRaw: {
        compilerOptions: {
          useDefineForClassFields: false,
        },
      },
    })
    // "verbatimModuleSyntax": true from tsconfig.json should still work
    expect(result.code).toMatch(/import.*".\/not-used-type";/)
  })

  test('overwrite tsconfigRaw string', async () => {
    const main = path.resolve(import.meta.dirname, '../src/main.ts')
    const mainContent = fs.readFileSync(main, 'utf-8')
    const result = await transformWithEsbuild(mainContent, main, {
      tsconfigRaw: `{
        "compilerOptions": {
          "useDefineForClassFields": false
        }
      }`,
    })
    // "verbatimModuleSyntax": true from tsconfig.json should not be read
    // and defaults to false
    expect(result.code).not.toMatch(/import.*".\/not-used-type";/)
  })

  test('verbatimModuleSyntax', async () => {
    const main = path.resolve(import.meta.dirname, '../src/main.ts')
    const mainContent = fs.readFileSync(main, 'utf-8')
    const result = await transformWithEsbuild(mainContent, main, {
      tsconfigRaw: {
        compilerOptions: {
          useDefineForClassFields: false,
          verbatimModuleSyntax: false,
        },
      },
    })
    // "verbatimModuleSyntax": false from tsconfig.json should still work
    expect(result.code).not.toMatch(/import.*".\/not-used-type";/)
  })

  test('experimentalDecorators', async () => {
    const main = path.resolve(import.meta.dirname, '../src/decorator.ts')
    const mainContent = fs.readFileSync(main, 'utf-8')
    // Should not error when transpiling decorators as nearest tsconfig.json
    // has "experimentalDecorators": true
    const result = await transformWithEsbuild(mainContent, main, {
      target: 'es2020',
    })
    expect(result.code).toContain('__decorateClass')
  })
})
