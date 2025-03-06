import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { assert, expect, test } from 'vitest'
import type { SourceMap } from 'rollup'
import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping'
import { transformWithEsbuild } from '../../plugins/esbuild'
import { ssrTransform } from '../ssrTransform'
import { createServer } from '../..'

const ssrTransformSimple = async (code: string, url = '') =>
  ssrTransform(code, null, url, code)
const ssrTransformSimpleCode = async (code: string, url?: string) =>
  (await ssrTransformSimple(code, url))?.code

test('default import', async () => {
  expect(
    await ssrTransformSimpleCode(`import foo from 'vue';console.log(foo.bar)`),
  ).toMatchInlineSnapshot(
    `"const __vite_ssr_import_0__ = await __vite_ssr_import__("vue", {"importedNames":["default"]});console.log(__vite_ssr_import_0__.default.bar)"`,
  )
})

test('named import', async () => {
  expect(
    await ssrTransformSimpleCode(
      `import { ref } from 'vue';function foo() { return ref(0) }`,
    ),
  ).toMatchInlineSnapshot(
    `"const __vite_ssr_import_0__ = await __vite_ssr_import__("vue", {"importedNames":["ref"]});function foo() { return (0,__vite_ssr_import_0__.ref)(0) }"`,
  )
})

test('named import: arbitrary module namespace specifier', async () => {
  expect(
    await ssrTransformSimpleCode(
      `import { "some thing" as ref } from 'vue';function foo() { return ref(0) }`,
    ),
  ).toMatchInlineSnapshot(
    `"const __vite_ssr_import_0__ = await __vite_ssr_import__("vue", {"importedNames":["some thing"]});function foo() { return (0,__vite_ssr_import_0__["some thing"])(0) }"`,
  )
})

test('namespace import', async () => {
  expect(
    await ssrTransformSimpleCode(
      `import * as vue from 'vue';function foo() { return vue.ref(0) }`,
    ),
  ).toMatchInlineSnapshot(
    `"const __vite_ssr_import_0__ = await __vite_ssr_import__("vue");function foo() { return __vite_ssr_import_0__.ref(0) }"`,
  )
})

test('export function declaration', async () => {
  expect(await ssrTransformSimpleCode(`export function foo() {}`))
    .toMatchInlineSnapshot(`
      "function foo() {}
      Object.defineProperty(__vite_ssr_exports__, "foo", { enumerable: true, configurable: true, get(){ return foo }});"
    `)
})

test('export class declaration', async () => {
  expect(await ssrTransformSimpleCode(`export class foo {}`))
    .toMatchInlineSnapshot(`
      "class foo {}
      Object.defineProperty(__vite_ssr_exports__, "foo", { enumerable: true, configurable: true, get(){ return foo }});"
    `)
})

test('export var declaration', async () => {
  expect(await ssrTransformSimpleCode(`export const a = 1, b = 2`))
    .toMatchInlineSnapshot(`
      "const a = 1, b = 2
      Object.defineProperty(__vite_ssr_exports__, "a", { enumerable: true, configurable: true, get(){ return a }});
      Object.defineProperty(__vite_ssr_exports__, "b", { enumerable: true, configurable: true, get(){ return b }});"
    `)
})

test('export named', async () => {
  expect(
    await ssrTransformSimpleCode(`const a = 1, b = 2; export { a, b as c }`),
  ).toMatchInlineSnapshot(`
    "const a = 1, b = 2; 
    Object.defineProperty(__vite_ssr_exports__, "a", { enumerable: true, configurable: true, get(){ return a }});
    Object.defineProperty(__vite_ssr_exports__, "c", { enumerable: true, configurable: true, get(){ return b }});"
  `)
})

test('export named from', async () => {
  expect(
    await ssrTransformSimpleCode(`export { ref, computed as c } from 'vue'`),
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__("vue", {"importedNames":["ref","computed"]});
    Object.defineProperty(__vite_ssr_exports__, "ref", { enumerable: true, configurable: true, get(){ return __vite_ssr_import_0__.ref }});
    Object.defineProperty(__vite_ssr_exports__, "c", { enumerable: true, configurable: true, get(){ return __vite_ssr_import_0__.computed }});"
  `)
})

test('named exports of imported binding', async () => {
  expect(
    await ssrTransformSimpleCode(
      `import {createApp} from 'vue';export {createApp}`,
    ),
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__("vue", {"importedNames":["createApp"]});
    Object.defineProperty(__vite_ssr_exports__, "createApp", { enumerable: true, configurable: true, get(){ return __vite_ssr_import_0__.createApp }});"
  `)
})

test('export * from', async () => {
  expect(
    await ssrTransformSimpleCode(
      `export * from 'vue'\n` + `export * from 'react'`,
    ),
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__("vue");__vite_ssr_exportAll__(__vite_ssr_import_0__);
    ;
    const __vite_ssr_import_1__ = await __vite_ssr_import__("react");__vite_ssr_exportAll__(__vite_ssr_import_1__);
    "
  `)
})

test('export * as from', async () => {
  expect(await ssrTransformSimpleCode(`export * as foo from 'vue'`))
    .toMatchInlineSnapshot(`
      "const __vite_ssr_import_0__ = await __vite_ssr_import__("vue");
      Object.defineProperty(__vite_ssr_exports__, "foo", { enumerable: true, configurable: true, get(){ return __vite_ssr_import_0__ }});"
    `)
})

test('re-export by imported name', async () => {
  expect(
    await ssrTransformSimpleCode(`\
import * as foo from 'foo'
export * as foo from 'foo'
`),
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__("foo");
    const __vite_ssr_import_1__ = await __vite_ssr_import__("foo");
    Object.defineProperty(__vite_ssr_exports__, "foo", { enumerable: true, configurable: true, get(){ return __vite_ssr_import_1__ }});
    "
  `)

  expect(
    await ssrTransformSimpleCode(`\
import { foo } from 'foo'
export { foo } from 'foo'
`),
  ).toMatchInlineSnapshot(`
      "const __vite_ssr_import_0__ = await __vite_ssr_import__("foo", {"importedNames":["foo"]});
      const __vite_ssr_import_1__ = await __vite_ssr_import__("foo", {"importedNames":["foo"]});
      Object.defineProperty(__vite_ssr_exports__, "foo", { enumerable: true, configurable: true, get(){ return __vite_ssr_import_1__.foo }});
      "
    `)

  expect(
    await ssrTransformSimpleCode(`\
import { foo } from 'foo'
export { foo as foo } from 'foo'
`),
  ).toMatchInlineSnapshot(`
      "const __vite_ssr_import_0__ = await __vite_ssr_import__("foo", {"importedNames":["foo"]});
      const __vite_ssr_import_1__ = await __vite_ssr_import__("foo", {"importedNames":["foo"]});
      Object.defineProperty(__vite_ssr_exports__, "foo", { enumerable: true, configurable: true, get(){ return __vite_ssr_import_1__.foo }});
      "
    `)
})

test('export * as from arbitrary module namespace identifier', async () => {
  expect(
    await ssrTransformSimpleCode(`export * as "arbitrary string" from 'vue'`),
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__("vue");
    Object.defineProperty(__vite_ssr_exports__, "arbitrary string", { enumerable: true, configurable: true, get(){ return __vite_ssr_import_0__ }});"
  `)
})

test('export as arbitrary module namespace identifier', async () => {
  expect(
    await ssrTransformSimpleCode(
      `const something = "Something";export { something as "arbitrary string" };`,
    ),
  ).toMatchInlineSnapshot(`
    "const something = "Something";
    Object.defineProperty(__vite_ssr_exports__, "arbitrary string", { enumerable: true, configurable: true, get(){ return something }});"
  `)
})

test('export as from arbitrary module namespace identifier', async () => {
  expect(
    await ssrTransformSimpleCode(
      `export { "arbitrary string2" as "arbitrary string" } from 'vue';`,
    ),
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__("vue", {"importedNames":["arbitrary string2"]});
    Object.defineProperty(__vite_ssr_exports__, "arbitrary string", { enumerable: true, configurable: true, get(){ return __vite_ssr_import_0__["arbitrary string2"] }});"
  `)
})

test('export default', async () => {
  expect(
    await ssrTransformSimpleCode(`export default {}`),
  ).toMatchInlineSnapshot(`"__vite_ssr_exports__.default = {}"`)
})

test('export then import minified', async () => {
  expect(
    await ssrTransformSimpleCode(
      `export * from 'vue';import {createApp} from 'vue';`,
    ),
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__("vue", {"importedNames":["createApp"]});const __vite_ssr_import_1__ = await __vite_ssr_import__("vue");__vite_ssr_exportAll__(__vite_ssr_import_1__);
    "
  `)
})

test('hoist import to top', async () => {
  expect(
    await ssrTransformSimpleCode(
      `path.resolve('server.js');import path from 'node:path';`,
    ),
  ).toMatchInlineSnapshot(
    `"const __vite_ssr_import_0__ = await __vite_ssr_import__("node:path", {"importedNames":["default"]});__vite_ssr_import_0__.default.resolve('server.js');"`,
  )
})

test('whitespace between imports does not trigger hoisting', async () => {
  expect(
    await ssrTransformSimpleCode(
      `import { dirname } from 'node:path';\n\n\nimport fs from 'node:fs';`,
    ),
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__("node:path", {"importedNames":["dirname"]});


    const __vite_ssr_import_1__ = await __vite_ssr_import__("node:fs", {"importedNames":["default"]});"
  `)
})

test('preserve line offset when rewriting imports', async () => {
  // The line number of each non-import statement must not change.
  const inputLines = [
    `debugger;`,
    ``,
    `import {`,
    `  dirname,`,
    `  join,`,
    `} from 'node:path';`,
    ``,
    `debugger;`,
    ``,
    `import fs from 'node:fs';`,
    ``,
    `debugger;`,
    ``,
    `import {`,
    `  red,`,
    `  green,`,
    `} from 'kleur/colors';`,
    ``,
    `debugger;`,
  ]

  const output = await ssrTransformSimpleCode(inputLines.join('\n'))
  expect(output).toBeDefined()

  const outputLines = output!.split('\n')
  expect(
    outputLines
      .map((line, i) => `${String(i + 1).padStart(2)} | ${line}`.trimEnd())
      .join('\n'),
  ).toMatchInlineSnapshot(`
    " 1 | const __vite_ssr_import_0__ = await __vite_ssr_import__("node:path", {"importedNames":["dirname","join"]});const __vite_ssr_import_1__ = await __vite_ssr_import__("node:fs", {"importedNames":["default"]});const __vite_ssr_import_2__ = await __vite_ssr_import__("kleur/colors", {"importedNames":["red","green"]});debugger;
     2 |
     3 |
     4 |
     5 |
     6 |
     7 |
     8 | debugger;
     9 |
    10 |
    11 |
    12 | debugger;
    13 |
    14 |
    15 |
    16 |
    17 |
    18 |
    19 | debugger;"
  `)

  // Ensure the debugger statements are still on the same lines.
  expect(outputLines[0].endsWith(inputLines[0])).toBe(true)
  expect(outputLines[7]).toBe(inputLines[7])
  expect(outputLines[11]).toBe(inputLines[11])
  expect(outputLines[18]).toBe(inputLines[18])
})

// not implemented
test.skip('comments between imports do not trigger hoisting', async () => {
  expect(
    await ssrTransformSimpleCode(
      `import { dirname } from 'node:path';// comment\nimport fs from 'node:fs';`,
    ),
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__("node:path", {"importedNames":["dirname"]});// comment
    const __vite_ssr_import_1__ = await __vite_ssr_import__("node:fs", {"importedNames":["default"]});"
  `)
})

test('import.meta', async () => {
  expect(
    await ssrTransformSimpleCode(`console.log(import.meta.url)`),
  ).toMatchInlineSnapshot(`"console.log(__vite_ssr_import_meta__.url)"`)
})

test('dynamic import', async () => {
  const result = await ssrTransformSimple(
    `export const i = () => import('./foo')`,
  )
  expect(result?.code).toMatchInlineSnapshot(`
    "const i = () => __vite_ssr_dynamic_import__('./foo')
    Object.defineProperty(__vite_ssr_exports__, "i", { enumerable: true, configurable: true, get(){ return i }});"
  `)
  expect(result?.deps).toEqual([])
  expect(result?.dynamicDeps).toEqual(['./foo'])
})

test('do not rewrite method definition', async () => {
  const result = await ssrTransformSimple(
    `import { fn } from 'vue';class A { fn() { fn() } }`,
  )
  expect(result?.code).toMatchInlineSnapshot(
    `"const __vite_ssr_import_0__ = await __vite_ssr_import__("vue", {"importedNames":["fn"]});class A { fn() { (0,__vite_ssr_import_0__.fn)() } }"`,
  )
  expect(result?.deps).toEqual(['vue'])
})

test('do not rewrite when variable is in scope', async () => {
  const result = await ssrTransformSimple(
    `import { fn } from 'vue';function A(){ const fn = () => {}; return { fn }; }`,
  )
  expect(result?.code).toMatchInlineSnapshot(
    `"const __vite_ssr_import_0__ = await __vite_ssr_import__("vue", {"importedNames":["fn"]});function A(){ const fn = () => {}; return { fn }; }"`,
  )
  expect(result?.deps).toEqual(['vue'])
})

// #5472
test('do not rewrite when variable is in scope with object destructuring', async () => {
  const result = await ssrTransformSimple(
    `import { fn } from 'vue';function A(){ let {fn, test} = {fn: 'foo', test: 'bar'}; return { fn }; }`,
  )
  expect(result?.code).toMatchInlineSnapshot(
    `"const __vite_ssr_import_0__ = await __vite_ssr_import__("vue", {"importedNames":["fn"]});function A(){ let {fn, test} = {fn: 'foo', test: 'bar'}; return { fn }; }"`,
  )
  expect(result?.deps).toEqual(['vue'])
})

// #5472
test('do not rewrite when variable is in scope with array destructuring', async () => {
  const result = await ssrTransformSimple(
    `import { fn } from 'vue';function A(){ let [fn, test] = ['foo', 'bar']; return { fn }; }`,
  )
  expect(result?.code).toMatchInlineSnapshot(
    `"const __vite_ssr_import_0__ = await __vite_ssr_import__("vue", {"importedNames":["fn"]});function A(){ let [fn, test] = ['foo', 'bar']; return { fn }; }"`,
  )
  expect(result?.deps).toEqual(['vue'])
})

// #5727
test('rewrite variable in string interpolation in function nested arguments', async () => {
  const result = await ssrTransformSimple(
    `import { fn } from 'vue';function A({foo = \`test\${fn}\`} = {}){ return {}; }`,
  )
  expect(result?.code).toMatchInlineSnapshot(
    `"const __vite_ssr_import_0__ = await __vite_ssr_import__("vue", {"importedNames":["fn"]});function A({foo = \`test\${__vite_ssr_import_0__.fn}\`} = {}){ return {}; }"`,
  )
  expect(result?.deps).toEqual(['vue'])
})

// #6520
test('rewrite variables in default value of destructuring params', async () => {
  const result = await ssrTransformSimple(
    `import { fn } from 'vue';function A({foo = fn}){ return {}; }`,
  )
  expect(result?.code).toMatchInlineSnapshot(
    `"const __vite_ssr_import_0__ = await __vite_ssr_import__("vue", {"importedNames":["fn"]});function A({foo = __vite_ssr_import_0__.fn}){ return {}; }"`,
  )
  expect(result?.deps).toEqual(['vue'])
})

test('do not rewrite when function declaration is in scope', async () => {
  const result = await ssrTransformSimple(
    `import { fn } from 'vue';function A(){ function fn() {}; return { fn }; }`,
  )
  expect(result?.code).toMatchInlineSnapshot(
    `"const __vite_ssr_import_0__ = await __vite_ssr_import__("vue", {"importedNames":["fn"]});function A(){ function fn() {}; return { fn }; }"`,
  )
  expect(result?.deps).toEqual(['vue'])
})

// #16452
test('do not rewrite when function expression is in scope', async () => {
  const result = await ssrTransformSimple(
    `import {fn} from './vue';var a = function() { return function fn() { console.log(fn) } }`,
  )
  expect(result?.code).toMatchInlineSnapshot(
    `"const __vite_ssr_import_0__ = await __vite_ssr_import__("./vue", {"importedNames":["fn"]});var a = function() { return function fn() { console.log(fn) } }"`,
  )
})

// #16452
test('do not rewrite when function expression is in global scope', async () => {
  const result = await ssrTransformSimple(
    `import {fn} from './vue';foo(function fn(a = fn) { console.log(fn) })`,
  )
  expect(result?.code).toMatchInlineSnapshot(
    `"const __vite_ssr_import_0__ = await __vite_ssr_import__("./vue", {"importedNames":["fn"]});foo(function fn(a = fn) { console.log(fn) })"`,
  )
})

test('do not rewrite when class declaration is in scope', async () => {
  const result = await ssrTransformSimple(
    `import { cls } from 'vue';function A(){ class cls {} return { cls }; }`,
  )
  expect(result?.code).toMatchInlineSnapshot(
    `"const __vite_ssr_import_0__ = await __vite_ssr_import__("vue", {"importedNames":["cls"]});function A(){ class cls {} return { cls }; }"`,
  )
  expect(result?.deps).toEqual(['vue'])
})

test('do not rewrite when class expression is in scope', async () => {
  const result = await ssrTransformSimple(
    `import { cls } from './vue';var a = function() { return class cls { constructor() { console.log(cls) } } }`,
  )
  expect(result?.code).toMatchInlineSnapshot(
    `"const __vite_ssr_import_0__ = await __vite_ssr_import__("./vue", {"importedNames":["cls"]});var a = function() { return class cls { constructor() { console.log(cls) } } }"`,
  )
})

test('do not rewrite when class expression is in global scope', async () => {
  const result = await ssrTransformSimple(
    `import { cls } from './vue';foo(class cls { constructor() { console.log(cls) } })`,
  )
  expect(result?.code).toMatchInlineSnapshot(
    `"const __vite_ssr_import_0__ = await __vite_ssr_import__("./vue", {"importedNames":["cls"]});foo(class cls { constructor() { console.log(cls) } })"`,
  )
})

test('do not rewrite catch clause', async () => {
  const result = await ssrTransformSimple(
    `import {error} from './dependency';try {} catch(error) {}`,
  )
  expect(result?.code).toMatchInlineSnapshot(
    `"const __vite_ssr_import_0__ = await __vite_ssr_import__("./dependency", {"importedNames":["error"]});try {} catch(error) {}"`,
  )
  expect(result?.deps).toEqual(['./dependency'])
})

// #2221
test('should declare variable for imported super class', async () => {
  expect(
    await ssrTransformSimpleCode(
      `import { Foo } from './dependency';` + `class A extends Foo {}`,
    ),
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__("./dependency", {"importedNames":["Foo"]});const Foo = __vite_ssr_import_0__.Foo;
    class A extends Foo {}"
  `)

  // exported classes: should prepend the declaration at root level, before the
  // first class that uses the binding
  expect(
    await ssrTransformSimpleCode(
      `import { Foo } from './dependency';` +
        `export default class A extends Foo {}\n` +
        `export class B extends Foo {}`,
    ),
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__("./dependency", {"importedNames":["Foo"]});const Foo = __vite_ssr_import_0__.Foo;
    class A extends Foo {};
    class B extends Foo {}
    Object.defineProperty(__vite_ssr_exports__, "B", { enumerable: true, configurable: true, get(){ return B }});
    Object.defineProperty(__vite_ssr_exports__, "default", { enumerable: true, configurable: true, value: A });"
  `)
})

// #4049
test('should handle default export variants', async () => {
  // default anonymous functions
  expect(await ssrTransformSimpleCode(`export default function() {}\n`))
    .toMatchInlineSnapshot(`
      "__vite_ssr_exports__.default = function() {}
      "
    `)
  // default anonymous class
  expect(await ssrTransformSimpleCode(`export default class {}\n`))
    .toMatchInlineSnapshot(`
      "__vite_ssr_exports__.default = class {}
      "
    `)
  // default named functions
  expect(
    await ssrTransformSimpleCode(
      `export default function foo() {}\n` +
        `foo.prototype = Object.prototype;`,
    ),
  ).toMatchInlineSnapshot(`
    "function foo() {};
    foo.prototype = Object.prototype;
    Object.defineProperty(__vite_ssr_exports__, "default", { enumerable: true, configurable: true, value: foo });"
  `)
  // default named classes
  expect(
    await ssrTransformSimpleCode(
      `export default class A {}\n` + `export class B extends A {}`,
    ),
  ).toMatchInlineSnapshot(`
    "class A {};
    class B extends A {}
    Object.defineProperty(__vite_ssr_exports__, "B", { enumerable: true, configurable: true, get(){ return B }});
    Object.defineProperty(__vite_ssr_exports__, "default", { enumerable: true, configurable: true, value: A });"
  `)
})

test('sourcemap source', async () => {
  const map = (
    await ssrTransform(
      `export const a = 1`,
      null,
      'input.js',
      'export const a = 1 /* */',
    )
  )?.map as SourceMap

  expect(map?.sources).toStrictEqual(['input.js'])
  expect(map?.sourcesContent).toStrictEqual(['export const a = 1 /* */'])
})

test('sourcemap is correct for hoisted imports', async () => {
  const code = `\n\n\nconsole.log(foo, bar);\nimport { foo } from 'vue';\nimport { bar } from 'vue2';`
  const result = (await ssrTransform(code, null, 'input.js', code))!

  expect(result.code).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__("vue", {"importedNames":["foo"]});const __vite_ssr_import_1__ = await __vite_ssr_import__("vue2", {"importedNames":["bar"]});


    console.log((0,__vite_ssr_import_0__.foo), (0,__vite_ssr_import_1__.bar));

    "
  `)

  const traceMap = new TraceMap(result.map as any)
  expect(originalPositionFor(traceMap, { line: 1, column: 0 })).toStrictEqual({
    source: 'input.js',
    line: 5,
    column: 0,
    name: null,
  })
  expect(originalPositionFor(traceMap, { line: 1, column: 90 })).toStrictEqual({
    source: 'input.js',
    line: 6,
    column: 0,
    name: null,
  })
})

test('sourcemap with multiple sources', async () => {
  const code = readFixture('bundle.js')
  const map = readFixture('bundle.js.map')

  const result = await ssrTransform(code, JSON.parse(map), '', code)
  assert(result?.map)

  const { sources } = result.map as SourceMap
  expect(sources).toContain('./first.ts')
  expect(sources).toContain('./second.ts')

  function readFixture(filename: string) {
    const url = new URL(
      `./fixtures/bundled-with-sourcemaps/${filename}`,
      import.meta.url,
    )

    return readFileSync(fileURLToPath(url), 'utf8')
  }
})

test('sourcemap with multiple sources and nested paths', async () => {
  const code = readFixture('dist.js')
  const map = readFixture('dist.js.map')

  const result = await ssrTransform(code, JSON.parse(map), '', code)
  assert(result?.map)

  const { sources } = result.map as SourceMap
  expect(sources).toMatchInlineSnapshot(`
    [
      "nested-directory/nested-file.js",
      "entrypoint.js",
    ]
  `)

  function readFixture(filename: string) {
    const url = new URL(
      `./fixtures/multi-source-sourcemaps/${filename}`,
      import.meta.url,
    )

    return readFileSync(fileURLToPath(url), 'utf8')
  }
})

test('overwrite bindings', async () => {
  expect(
    await ssrTransformSimpleCode(
      `import { inject } from 'vue';` +
        `const a = { inject }\n` +
        `const b = { test: inject }\n` +
        `function c() { const { test: inject } = { test: true }; console.log(inject) }\n` +
        `const d = inject\n` +
        `function f() {  console.log(inject) }\n` +
        `function e() { const { inject } = { inject: true } }\n` +
        `function g() { const f = () => { const inject = true }; console.log(inject) }\n`,
    ),
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__("vue", {"importedNames":["inject"]});const a = { inject: __vite_ssr_import_0__.inject };
    const b = { test: __vite_ssr_import_0__.inject };
    function c() { const { test: inject } = { test: true }; console.log(inject) }
    const d = __vite_ssr_import_0__.inject;
    function f() {  console.log((0,__vite_ssr_import_0__.inject)) }
    function e() { const { inject } = { inject: true } }
    function g() { const f = () => { const inject = true }; console.log((0,__vite_ssr_import_0__.inject)) }
    "
  `)
})

test('Empty array pattern', async () => {
  expect(
    await ssrTransformSimpleCode(`const [, LHS, RHS] = inMatch;`),
  ).toMatchInlineSnapshot(`"const [, LHS, RHS] = inMatch;"`)
})

test('function argument destructure', async () => {
  expect(
    await ssrTransformSimpleCode(
      `
import { foo, bar } from 'foo'
const a = ({ _ = foo() }) => {}
function b({ _ = bar() }) {}
function c({ _ = bar() + foo() }) {}
`,
    ),
  ).toMatchInlineSnapshot(`
    "
    const __vite_ssr_import_0__ = await __vite_ssr_import__("foo", {"importedNames":["foo","bar"]});
    const a = ({ _ = (0,__vite_ssr_import_0__.foo)() }) => {};
    function b({ _ = (0,__vite_ssr_import_0__.bar)() }) {}
    function c({ _ = (0,__vite_ssr_import_0__.bar)() + (0,__vite_ssr_import_0__.foo)() }) {}
    "
  `)
})

test('object destructure alias', async () => {
  expect(
    await ssrTransformSimpleCode(
      `
import { n } from 'foo'
const a = () => {
  const { type: n = 'bar' } = {}
  console.log(n)
}
`,
    ),
  ).toMatchInlineSnapshot(`
    "
    const __vite_ssr_import_0__ = await __vite_ssr_import__("foo", {"importedNames":["n"]});
    const a = () => {
      const { type: n = 'bar' } = {};
      console.log(n)
    }
    "
  `)

  // #9585
  expect(
    await ssrTransformSimpleCode(
      `
import { n, m } from 'foo'
const foo = {}

{
  const { [n]: m } = foo
}
`,
    ),
  ).toMatchInlineSnapshot(`
    "
    const __vite_ssr_import_0__ = await __vite_ssr_import__("foo", {"importedNames":["n","m"]});
    const foo = {};

    {
      const { [__vite_ssr_import_0__.n]: m } = foo
    }
    "
  `)
})

test('nested object destructure alias', async () => {
  expect(
    await ssrTransformSimpleCode(
      `
import { remove, add, get, set, rest, objRest } from 'vue'

function a() {
  const {
    o: { remove },
    a: { b: { c: [ add ] }},
    d: [{ get }, set, ...rest],
    ...objRest
  } = foo

  remove()
  add()
  get()
  set()
  rest()
  objRest()
}

remove()
add()
get()
set()
rest()
objRest()
`,
    ),
  ).toMatchInlineSnapshot(`
    "
    const __vite_ssr_import_0__ = await __vite_ssr_import__("vue", {"importedNames":["remove","add","get","set","rest","objRest"]});

    function a() {
      const {
        o: { remove },
        a: { b: { c: [ add ] }},
        d: [{ get }, set, ...rest],
        ...objRest
      } = foo;

      remove();
      add();
      get();
      set();
      rest();
      objRest()
    }

    (0,__vite_ssr_import_0__.remove)();
    (0,__vite_ssr_import_0__.add)();
    (0,__vite_ssr_import_0__.get)();
    (0,__vite_ssr_import_0__.set)();
    (0,__vite_ssr_import_0__.rest)();
    (0,__vite_ssr_import_0__.objRest)()
    "
  `)
})

test('object props and methods', async () => {
  expect(
    await ssrTransformSimpleCode(
      `
import foo from 'foo'

const bar = 'bar'

const obj = {
  foo() {},
  [foo]() {},
  [bar]() {},
  foo: () => {},
  [foo]: () => {},
  [bar]: () => {},
  bar(foo) {}
}
`,
    ),
  ).toMatchInlineSnapshot(`
    "
    const __vite_ssr_import_0__ = await __vite_ssr_import__("foo", {"importedNames":["default"]});

    const bar = 'bar';

    const obj = {
      foo() {},
      [__vite_ssr_import_0__.default]() {},
      [bar]() {},
      foo: () => {},
      [__vite_ssr_import_0__.default]: () => {},
      [bar]: () => {},
      bar(foo) {}
    }
    "
  `)
})

test('class props', async () => {
  expect(
    await ssrTransformSimpleCode(
      `
import { remove, add } from 'vue'

class A {
  remove = 1
  add = null
}
`,
    ),
  ).toMatchInlineSnapshot(`
    "
    const __vite_ssr_import_0__ = await __vite_ssr_import__("vue", {"importedNames":["remove","add"]});

    const add = __vite_ssr_import_0__.add;
    const remove = __vite_ssr_import_0__.remove;
    class A {
      remove = 1
      add = null
    }
    "
  `)
})

test('class methods', async () => {
  expect(
    await ssrTransformSimpleCode(
      `
import foo from 'foo'

const bar = 'bar'

class A {
  foo() {}
  [foo]() {}
  [bar]() {}
  #foo() {}
  bar(foo) {}
}
`,
    ),
  ).toMatchInlineSnapshot(`
    "
    const __vite_ssr_import_0__ = await __vite_ssr_import__("foo", {"importedNames":["default"]});

    const bar = 'bar';

    class A {
      foo() {}
      [__vite_ssr_import_0__.default]() {}
      [bar]() {}
      #foo() {}
      bar(foo) {}
    }
    "
  `)
})

test('declare scope', async () => {
  expect(
    await ssrTransformSimpleCode(
      `
import { aaa, bbb, ccc, ddd } from 'vue'

function foobar() {
  ddd()

  const aaa = () => {
    bbb(ccc)
    ddd()
  }
  const bbb = () => {
    console.log('hi')
  }
  const ccc = 1
  function ddd() {}

  aaa()
  bbb()
  ccc()
}

aaa()
bbb()
`,
    ),
  ).toMatchInlineSnapshot(`
    "
    const __vite_ssr_import_0__ = await __vite_ssr_import__("vue", {"importedNames":["aaa","bbb","ccc","ddd"]});

    function foobar() {
      ddd();

      const aaa = () => {
        bbb(ccc);
        ddd()
      };
      const bbb = () => {
        console.log('hi')
      };
      const ccc = 1;
      function ddd() {}

      aaa();
      bbb();
      ccc()
    }

    (0,__vite_ssr_import_0__.aaa)();
    (0,__vite_ssr_import_0__.bbb)()
    "
  `)
})

test('jsx', async () => {
  const code = `
  import React from 'react'
  import { Foo, Slot } from 'foo'

  function Bar({ Slot = <Foo /> }) {
    return (
      <>
        <Slot />
      </>
    )
  }
  `
  const id = '/foo.jsx'
  const result = await transformWithEsbuild(code, id)
  expect(await ssrTransformSimpleCode(result.code, '/foo.jsx'))
    .toMatchInlineSnapshot(`
      "const __vite_ssr_import_0__ = await __vite_ssr_import__("react", {"importedNames":["default"]});
      const __vite_ssr_import_1__ = await __vite_ssr_import__("foo", {"importedNames":["Foo","Slot"]});
      function Bar({ Slot: Slot2 = /* @__PURE__ */ __vite_ssr_import_0__.default.createElement((0,__vite_ssr_import_1__.Foo), null) }) {
        return /* @__PURE__ */ __vite_ssr_import_0__.default.createElement(__vite_ssr_import_0__.default.Fragment, null, /* @__PURE__ */ __vite_ssr_import_0__.default.createElement(Slot2, null));
      }
      "
    `)
})

test('continuous exports', async () => {
  expect(
    await ssrTransformSimpleCode(
      `
export function fn1() {
}export function fn2() {
}
        `,
    ),
  ).toMatchInlineSnapshot(`
    "
    function fn1() {
    }
    Object.defineProperty(__vite_ssr_exports__, "fn1", { enumerable: true, configurable: true, get(){ return fn1 }});;function fn2() {
    }
    Object.defineProperty(__vite_ssr_exports__, "fn2", { enumerable: true, configurable: true, get(){ return fn2 }});
            "
  `)
})

// https://github.com/vitest-dev/vitest/issues/1141
test('export default expression', async () => {
  // esbuild transform result of following TS code
  // export default <MyFn> function getRandom() {
  //   return Math.random()
  // }
  const code = `
export default (function getRandom() {
  return Math.random();
});
`.trim()

  expect(await ssrTransformSimpleCode(code)).toMatchInlineSnapshot(`
    "__vite_ssr_exports__.default = (function getRandom() {
      return Math.random();
    });"
  `)

  expect(
    await ssrTransformSimpleCode(`export default (class A {});`),
  ).toMatchInlineSnapshot(`"__vite_ssr_exports__.default = (class A {});"`)
})

// #8002
test('with hashbang', async () => {
  expect(
    await ssrTransformSimpleCode(
      `#!/usr/bin/env node
console.log("it can parse the hashbang")`,
    ),
  ).toMatchInlineSnapshot(`
    "#!/usr/bin/env node
    console.log("it can parse the hashbang")"
  `)
})

test('import hoisted after hashbang', async () => {
  expect(
    await ssrTransformSimpleCode(
      `#!/usr/bin/env node
console.log(foo);
import foo from "foo"`,
    ),
  ).toMatchInlineSnapshot(`
    "#!/usr/bin/env node
    const __vite_ssr_import_0__ = await __vite_ssr_import__("foo", {"importedNames":["default"]});console.log((0,__vite_ssr_import_0__.default));
    "
  `)
})

test('indentity function helper injected after hashbang', async () => {
  expect(
    await ssrTransformSimpleCode(
      `#!/usr/bin/env node
import { foo } from "foo"
foo()`,
    ),
  ).toMatchInlineSnapshot(`
    "#!/usr/bin/env node
    const __vite_ssr_import_0__ = await __vite_ssr_import__("foo", {"importedNames":["foo"]});
    (0,__vite_ssr_import_0__.foo)()"
  `)
})

// #10289
test('track scope by class, function, condition blocks', async () => {
  const code = `
import { foo, bar } from 'foobar'
if (false) {
  const foo = 'foo'
  console.log(foo)
} else if (false) {
  const [bar] = ['bar']
  console.log(bar)
} else {
  console.log(foo)
  console.log(bar)
}
export class Test {
  constructor() {
    if (false) {
      const foo = 'foo'
      console.log(foo)
    } else if (false) {
      const [bar] = ['bar']
      console.log(bar)
    } else {
      console.log(foo)
      console.log(bar)
    }
  }
};`.trim()

  expect(await ssrTransformSimpleCode(code)).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__("foobar", {"importedNames":["foo","bar"]});
    if (false) {
      const foo = 'foo';
      console.log(foo)
    } else if (false) {
      const [bar] = ['bar'];
      console.log(bar)
    } else {
      console.log((0,__vite_ssr_import_0__.foo));
      console.log((0,__vite_ssr_import_0__.bar))
    };
    class Test {
      constructor() {
        if (false) {
          const foo = 'foo';
          console.log(foo)
        } else if (false) {
          const [bar] = ['bar'];
          console.log(bar)
        } else {
          console.log((0,__vite_ssr_import_0__.foo));
          console.log((0,__vite_ssr_import_0__.bar))
        }
      }
    }
    Object.defineProperty(__vite_ssr_exports__, "Test", { enumerable: true, configurable: true, get(){ return Test }});;;"
  `)
})

// #10386
test('track var scope by function', async () => {
  expect(
    await ssrTransformSimpleCode(`
import { foo, bar } from 'foobar'
function test() {
  if (true) {
    var foo = () => { var why = 'would' }, bar = 'someone'
  }
  return [foo, bar]
}`),
  ).toMatchInlineSnapshot(`
    "
    const __vite_ssr_import_0__ = await __vite_ssr_import__("foobar", {"importedNames":["foo","bar"]});
    function test() {
      if (true) {
        var foo = () => { var why = 'would' }, bar = 'someone'
      };
      return [foo, bar]
    }"
  `)
})

// #11806
test('track scope by blocks', async () => {
  expect(
    await ssrTransformSimpleCode(`
import { foo, bar, baz } from 'foobar'
function test() {
  [foo];
  {
    let foo = 10;
    let bar = 10;
  }
  try {} catch (baz){ baz };
  return bar;
}`),
  ).toMatchInlineSnapshot(`
    "
    const __vite_ssr_import_0__ = await __vite_ssr_import__("foobar", {"importedNames":["foo","bar","baz"]});
    function test() {
      [__vite_ssr_import_0__.foo];
      {
        let foo = 10;
        let bar = 10;
      }
      try {} catch (baz){ baz };;
      return __vite_ssr_import_0__.bar;
    }"
  `)
})

test('track scope in for loops', async () => {
  expect(
    await ssrTransformSimpleCode(`
import { test } from './test.js'

for (const test of tests) {
  console.log(test)
}

for (let test = 0; test < 10; test++) {
  console.log(test)
}

for (const test in tests) {
  console.log(test)
}`),
  ).toMatchInlineSnapshot(`
    "
    const __vite_ssr_import_0__ = await __vite_ssr_import__("./test.js", {"importedNames":["test"]});

    for (const test of tests) {
      console.log(test)
    };

    for (let test = 0; test < 10; test++) {
      console.log(test)
    };

    for (const test in tests) {
      console.log(test)
    }"
  `)
})

test('avoid binding ClassExpression', async () => {
  const result = await ssrTransformSimple(
    `
import Foo, { Bar } from './foo';

console.log(Foo, Bar);
const obj = {
  foo: class Foo {},
  bar: class Bar {}
}
const Baz = class extends Foo {}
`,
  )
  expect(result?.code).toMatchInlineSnapshot(`
    "
    const __vite_ssr_import_0__ = await __vite_ssr_import__("./foo", {"importedNames":["default","Bar"]});

    console.log((0,__vite_ssr_import_0__.default), (0,__vite_ssr_import_0__.Bar));
    const obj = {
      foo: class Foo {},
      bar: class Bar {}
    };
    const Baz = class extends __vite_ssr_import_0__.default {}
    "
  `)
})

test('import assertion attribute', async () => {
  expect(
    await ssrTransformSimpleCode(`
  import * as foo from './foo.json' with { type: 'json' };
  import('./bar.json', { with: { type: 'json' } });
  `),
  ).toMatchInlineSnapshot(`
    "
      const __vite_ssr_import_0__ = await __vite_ssr_import__("./foo.json");
      __vite_ssr_dynamic_import__('./bar.json', { with: { type: 'json' } });
      "
  `)
})

test('import and export ordering', async () => {
  // Given all imported modules logs `mod ${mod}` on execution,
  // and `foo` is `bar`, the logging order should be:
  // "mod a", "mod foo", "mod b", "bar1", "bar2"
  expect(
    await ssrTransformSimpleCode(`
console.log(foo + 1)
export * from './a'
import { foo } from './foo'
export * from './b'
console.log(foo + 2)
  `),
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__("./foo", {"importedNames":["foo"]});
    console.log(__vite_ssr_import_0__.foo + 1);
    const __vite_ssr_import_1__ = await __vite_ssr_import__("./a");__vite_ssr_exportAll__(__vite_ssr_import_1__);
    ;

    const __vite_ssr_import_2__ = await __vite_ssr_import__("./b");__vite_ssr_exportAll__(__vite_ssr_import_2__);
    ;
    console.log(__vite_ssr_import_0__.foo + 2)
      "
  `)
})

test('identity function is declared before used', async () => {
  expect(
    await ssrTransformSimpleCode(`
import { foo } from './foo'
export default foo()
export * as bar from './bar'
console.log(bar)
  `),
  ).toMatchInlineSnapshot(`
    "
    const __vite_ssr_import_0__ = await __vite_ssr_import__("./foo", {"importedNames":["foo"]});
    __vite_ssr_exports__.default = (0,__vite_ssr_import_0__.foo)();
    const __vite_ssr_import_1__ = await __vite_ssr_import__("./bar");
    Object.defineProperty(__vite_ssr_exports__, "bar", { enumerable: true, configurable: true, get(){ return __vite_ssr_import_1__ }});;
    console.log(bar)
      "
  `)
})

test('inject semicolon for (0, ...) wrapper', async () => {
  expect(
    await ssrTransformSimpleCode(`
import { f } from './f'

let x = 0;

x
f()

if (1)
  x
f()

if (1)
  x
else
  x
f()


let y = x
f()

x /*;;*/ /*;;*/
f()

function z() {
  x
  f()

  if (1) {
    x
    f()
  }
}

let a = {}
f()

let b = () => {}
f()

function c() {
}
f()

class D {
}
f()

{
  x
}
f()

switch (1) {
  case 1:
    x
    f()
    break
}

if(0){}f()

if(0){}else{}f()

switch(1){}f()

{}f(1)
`),
  ).toMatchInlineSnapshot(`
    "
    const __vite_ssr_import_0__ = await __vite_ssr_import__("./f", {"importedNames":["f"]});

    let x = 0;

    x;
    (0,__vite_ssr_import_0__.f)();

    if (1)
      x;
    (0,__vite_ssr_import_0__.f)();

    if (1)
      x
    else
      x;
    (0,__vite_ssr_import_0__.f)();


    let y = x;
    (0,__vite_ssr_import_0__.f)();

    x; /*;;*/ /*;;*/
    (0,__vite_ssr_import_0__.f)();

    function z() {
      x;
      (0,__vite_ssr_import_0__.f)();

      if (1) {
        x;
        (0,__vite_ssr_import_0__.f)()
      }
    }

    let a = {};
    (0,__vite_ssr_import_0__.f)();

    let b = () => {};
    (0,__vite_ssr_import_0__.f)();

    function c() {
    }
    (0,__vite_ssr_import_0__.f)();

    class D {
    }
    (0,__vite_ssr_import_0__.f)();

    {
      x
    }
    (0,__vite_ssr_import_0__.f)();

    switch (1) {
      case 1:
        x;
        (0,__vite_ssr_import_0__.f)();
        break
    };

    if(0){};(0,__vite_ssr_import_0__.f)();

    if(0){}else{};(0,__vite_ssr_import_0__.f)();

    switch(1){};(0,__vite_ssr_import_0__.f)();

    {}(0,__vite_ssr_import_0__.f)(1)
    "
  `)
})

test('does not break minified code', async () => {
  // Based on https://unpkg.com/@headlessui/vue@1.7.23/dist/components/transitions/transition.js
  expect(
    await ssrTransformSimpleCode(
      `import O from 'a';
const c = () => {
  if(true){return}O(1,{})
}`,
    ),
  ).toMatchInlineSnapshot(
    `
    "const __vite_ssr_import_0__ = await __vite_ssr_import__("a", {"importedNames":["default"]});
    const c = () => {
      if(true){return};(0,__vite_ssr_import_0__.default)(1,{})
    }"
  `,
  )
})

test('combine mappings', async () => {
  const server = await createServer({
    configFile: false,
    envFile: false,
    logLevel: 'error',
    plugins: [
      {
        name: 'test-mappings',
        resolveId(source) {
          if (source.startsWith('virtual:test-mappings')) {
            return '\0' + source
          }
        },
        load(id) {
          if (id.startsWith('\0virtual:test-mappings')) {
            const code = `export default "test";\n`
            if (id === '\0virtual:test-mappings:empty') {
              return { code, map: { mappings: '' } }
            }
            if (id === '\0virtual:test-mappings:null') {
              return { code, map: null }
            }
          }
        },
      },
    ],
  })

  {
    const result = await server.environments.ssr.transformRequest(
      'virtual:test-mappings:empty',
    )
    expect(result?.map).toMatchInlineSnapshot(`
      {
        "mappings": "",
      }
    `)
    const mod = await server.ssrLoadModule('virtual:test-mappings:empty')
    expect(mod).toMatchInlineSnapshot(`
      {
        "default": "test",
      }
    `)
  }

  {
    const result = await server.environments.ssr.transformRequest(
      'virtual:test-mappings:null',
    )
    expect(result?.map).toMatchInlineSnapshot(`
      SourceMap {
        "file": undefined,
        "mappings": "AAAA,8BAAc,CAAC,CAAC,IAAI,CAAC;",
        "names": [],
        "sources": [
          "virtual:test-mappings:null",
        ],
        "sourcesContent": [
          "export default "test";
      ",
        ],
        "version": 3,
      }
    `)
    const mod = await server.ssrLoadModule('virtual:test-mappings:null')
    expect(mod).toMatchInlineSnapshot(`
      {
        "default": "test",
      }
    `)
  }
})
