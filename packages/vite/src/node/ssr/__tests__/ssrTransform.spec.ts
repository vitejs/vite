import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { assert, expect, test } from 'vitest'
import type { SourceMap } from 'rollup'
import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping'
import { transformWithEsbuild } from '../../plugins/esbuild'
import { ssrTransform } from '../ssrTransform'

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
    }
    "
  `)
})

test('does not break minified code', async () => {
  // https://unpkg.com/@headlessui/vue@1.7.23/dist/components/transitions/transition.js
  expect(
    await ssrTransformSimpleCode(
      `import{computed as w,defineComponent as K,h as k,inject as F,normalizeClass as ae,onMounted as C,onUnmounted as z,provide as B,ref as m,watch as le,watchEffect as x}from"vue";import{useId as ie}from'../../hooks/use-id.js';import{hasOpenClosed as se,State as u,useOpenClosed as oe,useOpenClosedProvider as ue}from'../../internal/open-closed.js';import{dom as $}from'../../utils/dom.js';import{env as fe}from'../../utils/env.js';import{match as O}from'../../utils/match.js';import{Features as de,omit as ve,render as q,RenderStrategy as T}from'../../utils/render.js';import{Reason as G,transition as J}from'./utils/transition.js';function g(e=""){return e.split(/\\s+/).filter(t=>t.length>1)}let R=Symbol("TransitionContext");var pe=(a=>(a.Visible="visible",a.Hidden="hidden",a))(pe||{});function me(){return F(R,null)!==null}function Te(){let e=F(R,null);if(e===null)throw new Error("A <TransitionChild /> is used but it is missing a parent <TransitionRoot />.");return e}function ge(){let e=F(N,null);if(e===null)throw new Error("A <TransitionChild /> is used but it is missing a parent <TransitionRoot />.");return e}let N=Symbol("NestingContext");function L(e){return"children"in e?L(e.children):e.value.filter(({state:t})=>t==="visible").length>0}function Q(e){let t=m([]),a=m(!1);C(()=>a.value=!0),z(()=>a.value=!1);function s(n,r=T.Hidden){let l=t.value.findIndex(({id:f})=>f===n);l!==-1&&(O(r,{[T.Unmount](){t.value.splice(l,1)},[T.Hidden](){t.value[l].state="hidden"}}),!L(t)&&a.value&&(e==null||e()))}function h(n){let r=t.value.find(({id:l})=>l===n);return r?r.state!=="visible"&&(r.state="visible"):t.value.push({id:n,state:"visible"}),()=>s(n,T.Unmount)}return{children:t,register:h,unregister:s}}let W=de.RenderStrategy,he=K({props:{as:{type:[Object,String],default:"div"},show:{type:[Boolean],default:null},unmount:{type:[Boolean],default:!0},appear:{type:[Boolean],default:!1},enter:{type:[String],default:""},enterFrom:{type:[String],default:""},enterTo:{type:[String],default:""},entered:{type:[String],default:""},leave:{type:[String],default:""},leaveFrom:{type:[String],default:""},leaveTo:{type:[String],default:""}},emits:{beforeEnter:()=>!0,afterEnter:()=>!0,beforeLeave:()=>!0,afterLeave:()=>!0},setup(e,{emit:t,attrs:a,slots:s,expose:h}){let n=m(0);function r(){n.value|=u.Opening,t("beforeEnter")}function l(){n.value&=~u.Opening,t("afterEnter")}function f(){n.value|=u.Closing,t("beforeLeave")}function S(){n.value&=~u.Closing,t("afterLeave")}if(!me()&&se())return()=>k(Se,{...e,onBeforeEnter:r,onAfterEnter:l,onBeforeLeave:f,onAfterLeave:S},s);let d=m(null),y=w(()=>e.unmount?T.Unmount:T.Hidden);h({el:d,$el:d});let{show:v,appear:A}=Te(),{register:D,unregister:H}=ge(),i=m(v.value?"visible":"hidden"),I={value:!0},c=ie(),b={value:!1},P=Q(()=>{!b.value&&i.value!=="hidden"&&(i.value="hidden",H(c),S())});C(()=>{let o=D(c);z(o)}),x(()=>{if(y.value===T.Hidden&&c){if(v.value&&i.value!=="visible"){i.value="visible";return}O(i.value,{["hidden"]:()=>H(c),["visible"]:()=>D(c)})}});let j=g(e.enter),M=g(e.enterFrom),X=g(e.enterTo),_=g(e.entered),Y=g(e.leave),Z=g(e.leaveFrom),ee=g(e.leaveTo);C(()=>{x(()=>{if(i.value==="visible"){let o=$(d);if(o instanceof Comment&&o.data==="")throw new Error("Did you forget to passthrough the ref to the actual DOM node?")}})});function te(o){let E=I.value&&!A.value,p=$(d);!p||!(p instanceof HTMLElement)||E||(b.value=!0,v.value&&r(),v.value||f(),o(v.value?J(p,j,M,X,_,V=>{b.value=!1,V===G.Finished&&l()}):J(p,Y,Z,ee,_,V=>{b.value=!1,V===G.Finished&&(L(P)||(i.value="hidden",H(c),S()))})))}return C(()=>{le([v],(o,E,p)=>{te(p),I.value=!1},{immediate:!0})}),B(N,P),ue(w(()=>O(i.value,{["visible"]:u.Open,["hidden"]:u.Closed})|n.value)),()=>{let{appear:o,show:E,enter:p,enterFrom:V,enterTo:Ce,entered:ye,leave:be,leaveFrom:Ee,leaveTo:Ve,...U}=e,ne={ref:d},re={...U,...A.value&&v.value&&fe.isServer?{class:ae([a.class,U.class,...j,...M])}:{}};return q({theirProps:re,ourProps:ne,slot:{},slots:s,attrs:a,features:W,visible:i.value==="visible",name:"TransitionChild"})}}}),ce=he,Se=K({inheritAttrs:!1,props:{as:{type:[Object,String],default:"div"},show:{type:[Boolean],default:null},unmount:{type:[Boolean],default:!0},appear:{type:[Boolean],default:!1},enter:{type:[String],default:""},enterFrom:{type:[String],default:""},enterTo:{type:[String],default:""},entered:{type:[String],default:""},leave:{type:[String],default:""},leaveFrom:{type:[String],default:""},leaveTo:{type:[String],default:""}},emits:{beforeEnter:()=>!0,afterEnter:()=>!0,beforeLeave:()=>!0,afterLeave:()=>!0},setup(e,{emit:t,attrs:a,slots:s}){let h=oe(),n=w(()=>e.show===null&&h!==null?(h.value&u.Open)===u.Open:e.show);x(()=>{if(![!0,!1].includes(n.value))throw new Error('A <Transition /> is used but it is missing a :show="true | false" prop.')});let r=m(n.value?"visible":"hidden"),l=Q(()=>{r.value="hidden"}),f=m(!0),S={show:n,appear:w(()=>e.appear||!f.value)};return C(()=>{x(()=>{f.value=!1,n.value?r.value="visible":L(l)||(r.value="hidden")})}),B(N,l),B(R,S),()=>{let d=ve(e,["show","appear","unmount","onBeforeEnter","onBeforeLeave","onAfterEnter","onAfterLeave"]),y={unmount:e.unmount};return q({ourProps:{...y,as:"template"},theirProps:{},slot:{},slots:{...s,default:()=>[k(ce,{onBeforeEnter:()=>t("beforeEnter"),onAfterEnter:()=>t("afterEnter"),onBeforeLeave:()=>t("beforeLeave"),onAfterLeave:()=>t("afterLeave"),...a,...y,...d},s.default)]},attrs:{},features:W,visible:r.value==="visible",name:"Transition"})}}});export{he as TransitionChild,Se as TransitionRoot};`,
    ),
  )
    .toMatchInlineSnapshot(`"const __vite_ssr_import_0__ = await __vite_ssr_import__("vue", {"importedNames":["computed","defineComponent","h","inject","normalizeClass","onMounted","onUnmounted","provide","ref","watch","watchEffect"]});const __vite_ssr_import_1__ = await __vite_ssr_import__("../../hooks/use-id.js", {"importedNames":["useId"]});const __vite_ssr_import_2__ = await __vite_ssr_import__("../../internal/open-closed.js", {"importedNames":["hasOpenClosed","State","useOpenClosed","useOpenClosedProvider"]});const __vite_ssr_import_3__ = await __vite_ssr_import__("../../utils/dom.js", {"importedNames":["dom"]});const __vite_ssr_import_4__ = await __vite_ssr_import__("../../utils/env.js", {"importedNames":["env"]});const __vite_ssr_import_5__ = await __vite_ssr_import__("../../utils/match.js", {"importedNames":["match"]});const __vite_ssr_import_6__ = await __vite_ssr_import__("../../utils/render.js", {"importedNames":["Features","omit","render","RenderStrategy"]});const __vite_ssr_import_7__ = await __vite_ssr_import__("./utils/transition.js", {"importedNames":["Reason","transition"]});function g(e=""){return e.split(/\\s+/).filter(t=>t.length>1)}let R=Symbol("TransitionContext");var pe=(a=>(a.Visible="visible",a.Hidden="hidden",a))(pe||{});function me(){return (0,__vite_ssr_import_0__.inject)(R,null)!==null}function Te(){let e=(0,__vite_ssr_import_0__.inject)(R,null);if(e===null)throw new Error("A <TransitionChild /> is used but it is missing a parent <TransitionRoot />.");return e}function ge(){let e=(0,__vite_ssr_import_0__.inject)(N,null);if(e===null)throw new Error("A <TransitionChild /> is used but it is missing a parent <TransitionRoot />.");return e}let N=Symbol("NestingContext");function L(e){return"children"in e?L(e.children):e.value.filter(({state:t})=>t==="visible").length>0}function Q(e){let t=(0,__vite_ssr_import_0__.ref)([]),a=(0,__vite_ssr_import_0__.ref)(!1);(0,__vite_ssr_import_0__.onMounted)(()=>a.value=!0),(0,__vite_ssr_import_0__.onUnmounted)(()=>a.value=!1);function s(n,r=__vite_ssr_import_6__.RenderStrategy.Hidden){let l=t.value.findIndex(({id:f})=>f===n);l!==-1&&((0,__vite_ssr_import_5__.match)(r,{[__vite_ssr_import_6__.RenderStrategy.Unmount](){t.value.splice(l,1)},[__vite_ssr_import_6__.RenderStrategy.Hidden](){t.value[l].state="hidden"}}),!L(t)&&a.value&&(e==null||e()))}function h(n){let r=t.value.find(({id:l})=>l===n);return r?r.state!=="visible"&&(r.state="visible"):t.value.push({id:n,state:"visible"}),()=>s(n,__vite_ssr_import_6__.RenderStrategy.Unmount)}return{children:t,register:h,unregister:s}}let W=__vite_ssr_import_6__.Features.RenderStrategy,he=(0,__vite_ssr_import_0__.defineComponent)({props:{as:{type:[Object,String],default:"div"},show:{type:[Boolean],default:null},unmount:{type:[Boolean],default:!0},appear:{type:[Boolean],default:!1},enter:{type:[String],default:""},enterFrom:{type:[String],default:""},enterTo:{type:[String],default:""},entered:{type:[String],default:""},leave:{type:[String],default:""},leaveFrom:{type:[String],default:""},leaveTo:{type:[String],default:""}},emits:{beforeEnter:()=>!0,afterEnter:()=>!0,beforeLeave:()=>!0,afterLeave:()=>!0},setup(e,{emit:t,attrs:a,slots:s,expose:h}){let n=(0,__vite_ssr_import_0__.ref)(0);function r(){n.value|=__vite_ssr_import_2__.State.Opening,t("beforeEnter")}function l(){n.value&=~__vite_ssr_import_2__.State.Opening,t("afterEnter")}function f(){n.value|=__vite_ssr_import_2__.State.Closing,t("beforeLeave")}function S(){n.value&=~__vite_ssr_import_2__.State.Closing,t("afterLeave")}if(!me()&&(0,__vite_ssr_import_2__.hasOpenClosed)())return()=>(0,__vite_ssr_import_0__.h)(Se,{...e,onBeforeEnter:r,onAfterEnter:l,onBeforeLeave:f,onAfterLeave:S},s);let d=(0,__vite_ssr_import_0__.ref)(null),y=(0,__vite_ssr_import_0__.computed)(()=>e.unmount?__vite_ssr_import_6__.RenderStrategy.Unmount:__vite_ssr_import_6__.RenderStrategy.Hidden);h({el:d,$el:d});let{show:v,appear:A}=Te(),{register:D,unregister:H}=ge(),i=(0,__vite_ssr_import_0__.ref)(v.value?"visible":"hidden"),I={value:!0},c=(0,__vite_ssr_import_1__.useId)(),b={value:!1},P=Q(()=>{!b.value&&i.value!=="hidden"&&(i.value="hidden",H(c),S())});(0,__vite_ssr_import_0__.onMounted)(()=>{let o=D(c);(0,__vite_ssr_import_0__.onUnmounted)(o)}),(0,__vite_ssr_import_0__.watchEffect)(()=>{if(y.value===__vite_ssr_import_6__.RenderStrategy.Hidden&&c){if(v.value&&i.value!=="visible"){i.value="visible";return}(0,__vite_ssr_import_5__.match)(i.value,{["hidden"]:()=>H(c),["visible"]:()=>D(c)})}});let j=g(e.enter),M=g(e.enterFrom),X=g(e.enterTo),_=g(e.entered),Y=g(e.leave),Z=g(e.leaveFrom),ee=g(e.leaveTo);(0,__vite_ssr_import_0__.onMounted)(()=>{(0,__vite_ssr_import_0__.watchEffect)(()=>{if(i.value==="visible"){let o=(0,__vite_ssr_import_3__.dom)(d);if(o instanceof Comment&&o.data==="")throw new Error("Did you forget to passthrough the ref to the actual DOM node?")}})});function te(o){let E=I.value&&!A.value,p=(0,__vite_ssr_import_3__.dom)(d);!p||!(p instanceof HTMLElement)||E||(b.value=!0,v.value&&r(),v.value||f(),o(v.value?(0,__vite_ssr_import_7__.transition)(p,j,M,X,_,V=>{b.value=!1,V===__vite_ssr_import_7__.Reason.Finished&&l()}):(0,__vite_ssr_import_7__.transition)(p,Y,Z,ee,_,V=>{b.value=!1,V===__vite_ssr_import_7__.Reason.Finished&&(L(P)||(i.value="hidden",H(c),S()))})))}return (0,__vite_ssr_import_0__.onMounted)(()=>{(0,__vite_ssr_import_0__.watch)([v],(o,E,p)=>{te(p),I.value=!1},{immediate:!0})}),(0,__vite_ssr_import_0__.provide)(N,P),(0,__vite_ssr_import_2__.useOpenClosedProvider)((0,__vite_ssr_import_0__.computed)(()=>(0,__vite_ssr_import_5__.match)(i.value,{["visible"]:__vite_ssr_import_2__.State.Open,["hidden"]:__vite_ssr_import_2__.State.Closed})|n.value)),()=>{let{appear:o,show:E,enter:p,enterFrom:V,enterTo:Ce,entered:ye,leave:be,leaveFrom:Ee,leaveTo:Ve,...U}=e,ne={ref:d},re={...U,...A.value&&v.value&&__vite_ssr_import_4__.env.isServer?{class:(0,__vite_ssr_import_0__.normalizeClass)([a.class,U.class,...j,...M])}:{}};return (0,__vite_ssr_import_6__.render)({theirProps:re,ourProps:ne,slot:{},slots:s,attrs:a,features:W,visible:i.value==="visible",name:"TransitionChild"})}}}),ce=he,Se=(0,__vite_ssr_import_0__.defineComponent)({inheritAttrs:!1,props:{as:{type:[Object,String],default:"div"},show:{type:[Boolean],default:null},unmount:{type:[Boolean],default:!0},appear:{type:[Boolean],default:!1},enter:{type:[String],default:""},enterFrom:{type:[String],default:""},enterTo:{type:[String],default:""},entered:{type:[String],default:""},leave:{type:[String],default:""},leaveFrom:{type:[String],default:""},leaveTo:{type:[String],default:""}},emits:{beforeEnter:()=>!0,afterEnter:()=>!0,beforeLeave:()=>!0,afterLeave:()=>!0},setup(e,{emit:t,attrs:a,slots:s}){let h=(0,__vite_ssr_import_2__.useOpenClosed)(),n=(0,__vite_ssr_import_0__.computed)(()=>e.show===null&&h!==null?(h.value&__vite_ssr_import_2__.State.Open)===__vite_ssr_import_2__.State.Open:e.show);(0,__vite_ssr_import_0__.watchEffect)(()=>{if(![!0,!1].includes(n.value))throw new Error('A <Transition /> is used but it is missing a :show="true | false" prop.')});let r=(0,__vite_ssr_import_0__.ref)(n.value?"visible":"hidden"),l=Q(()=>{r.value="hidden"}),f=(0,__vite_ssr_import_0__.ref)(!0),S={show:n,appear:(0,__vite_ssr_import_0__.computed)(()=>e.appear||!f.value)};return (0,__vite_ssr_import_0__.onMounted)(()=>{(0,__vite_ssr_import_0__.watchEffect)(()=>{f.value=!1,n.value?r.value="visible":L(l)||(r.value="hidden")})}),(0,__vite_ssr_import_0__.provide)(N,l),(0,__vite_ssr_import_0__.provide)(R,S),()=>{let d=(0,__vite_ssr_import_6__.omit)(e,["show","appear","unmount","onBeforeEnter","onBeforeLeave","onAfterEnter","onAfterLeave"]),y={unmount:e.unmount};return (0,__vite_ssr_import_6__.render)({ourProps:{...y,as:"template"},theirProps:{},slot:{},slots:{...s,default:()=>[(0,__vite_ssr_import_0__.h)(ce,{onBeforeEnter:()=>t("beforeEnter"),onAfterEnter:()=>t("afterEnter"),onBeforeLeave:()=>t("beforeLeave"),onAfterLeave:()=>t("afterLeave"),...a,...y,...d},s.default)]},attrs:{},features:W,visible:r.value==="visible",name:"Transition"})}}});
Object.defineProperty(__vite_ssr_exports__, "TransitionChild", { enumerable: true, configurable: true, get(){ return he }});
Object.defineProperty(__vite_ssr_exports__, "TransitionRoot", { enumerable: true, configurable: true, get(){ return Se }});"`)
})
