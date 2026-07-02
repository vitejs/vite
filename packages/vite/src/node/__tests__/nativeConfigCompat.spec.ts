import { describe, expect, test } from 'vitest'
import { parseSync } from 'rolldown/utils'
import {
  analyzeConfigModuleReferences,
  classifyImportRef,
  formatNativeConfigIncompatWarning,
} from '../nativeConfigCompat'
import type { ConfigImportRef } from '../nativeConfigCompat'

const FILE = '/project/vite.config.ts'
const ref = (
  specifier: string,
  hasTypeJsonAttribute = false,
): ConfigImportRef => ({ specifier, line: 1, column: 0, hasTypeJsonAttribute })

const analyze = (code: string) =>
  analyzeConfigModuleReferences(code, parseSync(FILE, code).program, FILE)

describe('classifyImportRef', () => {
  test('flags extension-less relative import', () => {
    const r = classifyImportRef(ref('./helper'), '/project/helper.ts', FILE)
    expect(r).toMatchObject({
      type: 'extensionless-import',
      specifier: './helper',
    })
  })

  test('flags directory-index import', () => {
    const r = classifyImportRef(
      ref('./plugins'),
      '/project/plugins/index.ts',
      FILE,
    )
    expect(r).toMatchObject({
      type: 'directory-index-import',
      specifier: './plugins',
    })
  })

  test('flags JSON import without attributes', () => {
    const r = classifyImportRef(ref('./data.json'), null, FILE)
    expect(r).toMatchObject({
      type: 'json-without-attributes',
      specifier: './data.json',
    })
  })

  test('allows JSON import with attributes', () => {
    expect(
      classifyImportRef(ref('./data.json', true), null, FILE),
    ).toBeUndefined()
  })

  test('allows fully specified relative import', () => {
    expect(
      classifyImportRef(ref('./helper.ts'), '/project/helper.ts', FILE),
    ).toBeUndefined()
  })

  test('allows explicit index file import', () => {
    expect(
      classifyImportRef(
        ref('./plugins/index.js'),
        '/project/plugins/index.js',
        FILE,
      ),
    ).toBeUndefined()
  })

  test('ignores unresolved non-json import', () => {
    expect(classifyImportRef(ref('./missing'), null, FILE)).toBeUndefined()
  })
})

describe('analyzeConfigModuleReferences', () => {
  test('detects __dirname and __filename globals', () => {
    const { globals } = analyze(
      `export default { a: __dirname, b: __filename }\n`,
    )
    expect(globals.map((g) => g.type).sort()).toEqual(['dirname', 'filename'])
    expect(globals[0]).toMatchObject({ file: FILE, line: 1 })
  })

  test('ignores member access and object keys named __dirname', () => {
    const { globals } = analyze(
      `export default { __dirname: 1, x: foo.__dirname }\n`,
    )
    expect(globals).toEqual([])
  })

  test('ignores locally declared __dirname (native-compatible polyfill)', () => {
    const { globals } = analyze(
      `import { fileURLToPath } from 'node:url'\n` +
        `const __dirname = fileURLToPath(new URL('.', import.meta.url))\n` +
        `export default { a: __dirname }\n`,
    )
    expect(globals).toEqual([])
  })

  test('detects a shorthand property reference to __dirname', () => {
    const { globals } = analyze(`export default { __dirname }\n`)
    expect(globals.map((g) => g.type)).toEqual(['dirname'])
  })

  test('detects __dirname in a config using TypeScript syntax', () => {
    const { globals } = analyze(
      `enum E { A }\n` +
        `const x = 1 as number\n` +
        `export default { d: __dirname, e: E.A, x }\n`,
    )
    expect(globals.map((g) => g.type)).toEqual(['dirname'])
  })

  test('collects relative import specifiers and ignores bare imports', () => {
    const { imports } = analyze(
      `import a from './helper'\n` +
        `import b from 'vite'\n` +
        `import c from './data.json' with { type: 'json' }\n` +
        `export * from './reexport'\n` +
        `const d = import('./dyn')\n` +
        `export default { a, b, c, d }\n`,
    )
    const specs = imports.map((i) => i.specifier).sort()
    expect(specs).toEqual(['./data.json', './dyn', './helper', './reexport'])
    const json = imports.find((i) => i.specifier === './data.json')!
    expect(json.hasTypeJsonAttribute).toBe(true)
    const helper = imports.find((i) => i.specifier === './helper')!
    expect(helper.hasTypeJsonAttribute).toBe(false)
    expect(helper.line).toBe(1)
  })
})

describe('formatNativeConfigIncompatWarning', () => {
  test('renders each finding with a relative location and fix hint', () => {
    const msg = formatNativeConfigIncompatWarning(
      [
        {
          type: 'dirname',
          file: '/project/vite.config.ts',
          line: 3,
          column: 10,
        },
        {
          type: 'extensionless-import',
          file: '/project/vite.config.ts',
          line: 1,
          column: 15,
          specifier: './helper',
        },
      ],
      '/project',
    )
    expect(msg).toContain("configLoader: 'native'")
    expect(msg).toContain('__dirname')
    expect(msg).toContain('import.meta.dirname')
    expect(msg).toContain('vite.config.ts:3')
    expect(msg).toContain('./helper')
    expect(msg).toContain('vite.config.ts:1')
  })
})
