import path from 'node:path'
import fs from 'node:fs'
import { transformWithEsbuild } from 'vite'
import { describe, expect, test } from 'vitest'
import { browserLogs, isServe, serverLogs } from '~utils'

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
    const main = path.resolve(__dirname, '../src/main.ts')
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
    const main = path.resolve(__dirname, '../src/main.ts')
    const mainContent = fs.readFileSync(main, 'utf-8')
    const result = await transformWithEsbuild(mainContent, main, {
      tsconfigRaw: `{
        "compilerOptions": {
          "useDefineForClassFields": false
        }
      }`,
    })
    // "verbatimModuleSyntax": true from from tsconfig.json should not be read
    // and defaults to false
    expect(result.code).not.toMatch(/import.*".\/not-used-type";/)
  })

  test('verbatimModuleSyntax', async () => {
    const main = path.resolve(__dirname, '../src/main.ts')
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
    const main = path.resolve(__dirname, '../src/decorator.ts')
    const mainContent = fs.readFileSync(main, 'utf-8')
    // Should not error when transpiling decorators as nearest tsconfig.json
    // has "experimentalDecorators": true
    const result = await transformWithEsbuild(mainContent, main, {
      target: 'es2020',
    })
    expect(result.code).toContain('__decorateClass')
  })
})
