import { expect, test } from 'vitest'
import { transformWithEsbuild } from '../../plugins/esbuild'
import { traverseHtml } from '../../plugins/html'
import { ssrTransform } from '../ssrTransform'

test('default import', async () => {
  expect(
    (
      await ssrTransform(
        `import foo from 'vue';console.log(foo.bar)`,
        null,
        null
      )
    ).code
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\");
    console.log(__vite_ssr_import_0__.default.bar)"
  `)
})

test('named import', async () => {
  expect(
    (
      await ssrTransform(
        `import { ref } from 'vue';function foo() { return ref(0) }`,
        null,
        null
      )
    ).code
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\");
    function foo() { return __vite_ssr_import_0__.ref(0) }"
  `)
})

test('namespace import', async () => {
  expect(
    (
      await ssrTransform(
        `import * as vue from 'vue';function foo() { return vue.ref(0) }`,
        null,
        null
      )
    ).code
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\");
    function foo() { return __vite_ssr_import_0__.ref(0) }"
  `)
})

test('export function declaration', async () => {
  expect((await ssrTransform(`export function foo() {}`, null, null)).code)
    .toMatchInlineSnapshot(`
    "function foo() {}
    Object.defineProperty(__vite_ssr_exports__, \\"foo\\", { enumerable: true, configurable: true, get(){ return foo }});"
  `)
})

test('export class declaration', async () => {
  expect((await ssrTransform(`export class foo {}`, null, null)).code)
    .toMatchInlineSnapshot(`
    "class foo {}
    Object.defineProperty(__vite_ssr_exports__, \\"foo\\", { enumerable: true, configurable: true, get(){ return foo }});"
  `)
})

test('export var declaration', async () => {
  expect((await ssrTransform(`export const a = 1, b = 2`, null, null)).code)
    .toMatchInlineSnapshot(`
    "const a = 1, b = 2
    Object.defineProperty(__vite_ssr_exports__, \\"a\\", { enumerable: true, configurable: true, get(){ return a }});
    Object.defineProperty(__vite_ssr_exports__, \\"b\\", { enumerable: true, configurable: true, get(){ return b }});"
  `)
})

test('export named', async () => {
  expect(
    (await ssrTransform(`const a = 1, b = 2; export { a, b as c }`, null, null))
      .code
  ).toMatchInlineSnapshot(`
    "const a = 1, b = 2; 
    Object.defineProperty(__vite_ssr_exports__, \\"a\\", { enumerable: true, configurable: true, get(){ return a }});
    Object.defineProperty(__vite_ssr_exports__, \\"c\\", { enumerable: true, configurable: true, get(){ return b }});"
  `)
})

test('export named from', async () => {
  expect(
    (await ssrTransform(`export { ref, computed as c } from 'vue'`, null, null))
      .code
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\");

    Object.defineProperty(__vite_ssr_exports__, \\"ref\\", { enumerable: true, configurable: true, get(){ return __vite_ssr_import_0__.ref }});
    Object.defineProperty(__vite_ssr_exports__, \\"c\\", { enumerable: true, configurable: true, get(){ return __vite_ssr_import_0__.computed }});"
  `)
})

test('named exports of imported binding', async () => {
  expect(
    (
      await ssrTransform(
        `import {createApp} from 'vue';export {createApp}`,
        null,
        null
      )
    ).code
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\");

    Object.defineProperty(__vite_ssr_exports__, \\"createApp\\", { enumerable: true, configurable: true, get(){ return __vite_ssr_import_0__.createApp }});"
  `)
})

test('export * from', async () => {
  expect(
    (
      await ssrTransform(
        `export * from 'vue'\n` + `export * from 'react'`,
        null,
        null
      )
    ).code
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\");
    __vite_ssr_exportAll__(__vite_ssr_import_0__);
    const __vite_ssr_import_1__ = await __vite_ssr_import__(\\"react\\");
    __vite_ssr_exportAll__(__vite_ssr_import_1__);"
  `)
})

test('export * as from', async () => {
  expect((await ssrTransform(`export * as foo from 'vue'`, null, null)).code)
    .toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\");

    Object.defineProperty(__vite_ssr_exports__, \\"foo\\", { enumerable: true, configurable: true, get(){ return __vite_ssr_import_0__ }});"
  `)
})

test('export default', async () => {
  expect(
    (await ssrTransform(`export default {}`, null, null)).code
  ).toMatchInlineSnapshot(`"__vite_ssr_exports__.default = {}"`)
})

test('import.meta', async () => {
  expect(
    (await ssrTransform(`console.log(import.meta.url)`, null, null)).code
  ).toMatchInlineSnapshot(`"console.log(__vite_ssr_import_meta__.url)"`)
})

test('dynamic import', async () => {
  const result = await ssrTransform(
    `export const i = () => import('./foo')`,
    null,
    null
  )
  expect(result.code).toMatchInlineSnapshot(`
    "const i = () => __vite_ssr_dynamic_import__('./foo')
    Object.defineProperty(__vite_ssr_exports__, \\"i\\", { enumerable: true, configurable: true, get(){ return i }});"
  `)
  expect(result.deps).toEqual([])
  expect(result.dynamicDeps).toEqual(['./foo'])
})

test('do not rewrite method definition', async () => {
  const result = await ssrTransform(
    `import { fn } from 'vue';class A { fn() { fn() } }`,
    null,
    null
  )
  expect(result.code).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\");
    class A { fn() { __vite_ssr_import_0__.fn() } }"
  `)
  expect(result.deps).toEqual(['vue'])
})

test('do not rewrite when variable is in scope', async () => {
  const result = await ssrTransform(
    `import { fn } from 'vue';function A(){ const fn = () => {}; return { fn }; }`,
    null,
    null
  )
  expect(result.code).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\");
    function A(){ const fn = () => {}; return { fn }; }"
  `)
  expect(result.deps).toEqual(['vue'])
})

// #5472
test('do not rewrite when variable is in scope with object destructuring', async () => {
  const result = await ssrTransform(
    `import { fn } from 'vue';function A(){ let {fn, test} = {fn: 'foo', test: 'bar'}; return { fn }; }`,
    null,
    null
  )
  expect(result.code).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\");
    function A(){ let {fn, test} = {fn: 'foo', test: 'bar'}; return { fn }; }"
  `)
  expect(result.deps).toEqual(['vue'])
})

// #5472
test('do not rewrite when variable is in scope with array destructuring', async () => {
  const result = await ssrTransform(
    `import { fn } from 'vue';function A(){ let [fn, test] = ['foo', 'bar']; return { fn }; }`,
    null,
    null
  )
  expect(result.code).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\");
    function A(){ let [fn, test] = ['foo', 'bar']; return { fn }; }"
  `)
  expect(result.deps).toEqual(['vue'])
})

// #5727
test('rewrite variable in string interpolation in function nested arguments', async () => {
  const result = await ssrTransform(
    `import { fn } from 'vue';function A({foo = \`test\${fn}\`} = {}){ return {}; }`,
    null,
    null
  )
  expect(result.code).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\");
    function A({foo = \`test\${__vite_ssr_import_0__.fn}\`} = {}){ return {}; }"
  `)
  expect(result.deps).toEqual(['vue'])
})

// #6520
test('rewrite variables in default value of destructuring params', async () => {
  const result = await ssrTransform(
    `import { fn } from 'vue';function A({foo = fn}){ return {}; }`,
    null,
    null
  )
  expect(result.code).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\");
    function A({foo = __vite_ssr_import_0__.fn}){ return {}; }"
  `)
  expect(result.deps).toEqual(['vue'])
})

test('do not rewrite when function declaration is in scope', async () => {
  const result = await ssrTransform(
    `import { fn } from 'vue';function A(){ function fn() {}; return { fn }; }`,
    null,
    null
  )
  expect(result.code).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\");
    function A(){ function fn() {}; return { fn }; }"
  `)
  expect(result.deps).toEqual(['vue'])
})

test('do not rewrite catch clause', async () => {
  const result = await ssrTransform(
    `import {error} from './dependency';try {} catch(error) {}`,
    null,
    null
  )
  expect(result.code).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"./dependency\\");
    try {} catch(error) {}"
  `)
  expect(result.deps).toEqual(['./dependency'])
})

// #2221
test('should declare variable for imported super class', async () => {
  expect(
    (
      await ssrTransform(
        `import { Foo } from './dependency';` + `class A extends Foo {}`,
        null,
        null
      )
    ).code
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"./dependency\\");
    const Foo = __vite_ssr_import_0__.Foo;
    class A extends Foo {}"
  `)

  // exported classes: should prepend the declaration at root level, before the
  // first class that uses the binding
  expect(
    (
      await ssrTransform(
        `import { Foo } from './dependency';` +
          `export default class A extends Foo {}\n` +
          `export class B extends Foo {}`,
        null,
        null
      )
    ).code
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"./dependency\\");
    const Foo = __vite_ssr_import_0__.Foo;
    class A extends Foo {}
    class B extends Foo {}
    Object.defineProperty(__vite_ssr_exports__, \\"B\\", { enumerable: true, configurable: true, get(){ return B }});
    Object.defineProperty(__vite_ssr_exports__, \\"default\\", { enumerable: true, value: A });"
  `)
})

// #4049
test('should handle default export variants', async () => {
  // default anonymous functions
  expect(
    (await ssrTransform(`export default function() {}\n`, null, null)).code
  ).toMatchInlineSnapshot(`
    "__vite_ssr_exports__.default = function() {}
    "
  `)
  // default anonymous class
  expect((await ssrTransform(`export default class {}\n`, null, null)).code)
    .toMatchInlineSnapshot(`
    "__vite_ssr_exports__.default = class {}
    "
  `)
  // default named functions
  expect(
    (
      await ssrTransform(
        `export default function foo() {}\n` +
          `foo.prototype = Object.prototype;`,
        null,
        null
      )
    ).code
  ).toMatchInlineSnapshot(`
    "function foo() {}
    foo.prototype = Object.prototype;
    Object.defineProperty(__vite_ssr_exports__, \\"default\\", { enumerable: true, value: foo });"
  `)
  // default named classes
  expect(
    (
      await ssrTransform(
        `export default class A {}\n` + `export class B extends A {}`,
        null,
        null
      )
    ).code
  ).toMatchInlineSnapshot(`
    "class A {}
    class B extends A {}
    Object.defineProperty(__vite_ssr_exports__, \\"B\\", { enumerable: true, configurable: true, get(){ return B }});
    Object.defineProperty(__vite_ssr_exports__, \\"default\\", { enumerable: true, value: A });"
  `)
})

test('sourcemap source', async () => {
  expect(
    (await ssrTransform(`export const a = 1`, null, 'input.js')).map.sources
  ).toStrictEqual(['input.js'])
})

test('overwrite bindings', async () => {
  expect(
    (
      await ssrTransform(
        `import { inject } from 'vue';` +
          `const a = { inject }\n` +
          `const b = { test: inject }\n` +
          `function c() { const { test: inject } = { test: true }; console.log(inject) }\n` +
          `const d = inject\n` +
          `function f() {  console.log(inject) }\n` +
          `function e() { const { inject } = { inject: true } }\n` +
          `function g() { const f = () => { const inject = true }; console.log(inject) }\n`,
        null,
        null
      )
    ).code
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\");
    const a = { inject: __vite_ssr_import_0__.inject }
    const b = { test: __vite_ssr_import_0__.inject }
    function c() { const { test: inject } = { test: true }; console.log(inject) }
    const d = __vite_ssr_import_0__.inject
    function f() {  console.log(__vite_ssr_import_0__.inject) }
    function e() { const { inject } = { inject: true } }
    function g() { const f = () => { const inject = true }; console.log(__vite_ssr_import_0__.inject) }
    "
  `)
})

test('Empty array pattern', async () => {
  expect(
    (await ssrTransform(`const [, LHS, RHS] = inMatch;`, null, null)).code
  ).toMatchInlineSnapshot(`"const [, LHS, RHS] = inMatch;"`)
})

test('function argument destructure', async () => {
  expect(
    (
      await ssrTransform(
        `
import { foo, bar } from 'foo'
const a = ({ _ = foo() }) => {}
function b({ _ = bar() }) {}
function c({ _ = bar() + foo() }) {}
`,
        null,
        null
      )
    ).code
  ).toMatchInlineSnapshot(`
    "
    const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"foo\\");

    const a = ({ _ = __vite_ssr_import_0__.foo() }) => {}
    function b({ _ = __vite_ssr_import_0__.bar() }) {}
    function c({ _ = __vite_ssr_import_0__.bar() + __vite_ssr_import_0__.foo() }) {}
    "
  `)
})

test('object destructure alias', async () => {
  expect(
    (
      await ssrTransform(
        `
import { n } from 'foo'
const a = () => {
  const { type: n = 'bar' } = {}
  console.log(n)
}
`,
        null,
        null
      )
    ).code
  ).toMatchInlineSnapshot(`
    "
    const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"foo\\");

    const a = () => {
      const { type: n = 'bar' } = {}
      console.log(n)
    }
    "
  `)
})

test('nested object destructure alias', async () => {
  expect(
    (
      await ssrTransform(
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
        null,
        null
      )
    ).code
  ).toMatchInlineSnapshot(`
    "
    const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\");


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

    __vite_ssr_import_0__.remove()
    __vite_ssr_import_0__.add()
    __vite_ssr_import_0__.get()
    __vite_ssr_import_0__.set()
    __vite_ssr_import_0__.rest()
    __vite_ssr_import_0__.objRest()
    "
  `)
})

test('class props', async () => {
  expect(
    (
      await ssrTransform(
        `
import { remove, add } from 'vue'

class A {
  remove = 1
  add = null
}
`,
        null,
        null
      )
    ).code
  ).toMatchInlineSnapshot(`
    "
    const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\");


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
    (
      await ssrTransform(
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
        null,
        null
      )
    ).code
  ).toMatchInlineSnapshot(`
    "
    const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"foo\\");


    const bar = 'bar'

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
    (
      await ssrTransform(
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
        null,
        null
      )
    ).code
  ).toMatchInlineSnapshot(`
    "
    const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\");


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

    __vite_ssr_import_0__.aaa()
    __vite_ssr_import_0__.bbb()
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
  expect((await ssrTransform(result.code, null, '/foo.jsx')).code)
    .toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"react\\");

    const __vite_ssr_import_1__ = await __vite_ssr_import__(\\"foo\\");

    function Bar({ Slot: Slot2 = /* @__PURE__ */ __vite_ssr_import_0__.default.createElement(__vite_ssr_import_1__.Foo, null) }) {
      return /* @__PURE__ */ __vite_ssr_import_0__.default.createElement(__vite_ssr_import_0__.default.Fragment, null, /* @__PURE__ */ __vite_ssr_import_0__.default.createElement(Slot2, null));
    }
    "
  `)
})

test('continuous exports', async () => {
  expect(
    (
      await ssrTransform(
        `
export function fn1() {
}export function fn2() {
}
        `,
        null,
        null
      )
    ).code
  ).toMatchInlineSnapshot(`
    "
    function fn1() {
    }
    Object.defineProperty(__vite_ssr_exports__, \\"fn1\\", { enumerable: true, configurable: true, get(){ return fn1 }});function fn2() {
    }
    Object.defineProperty(__vite_ssr_exports__, \\"fn2\\", { enumerable: true, configurable: true, get(){ return fn2 }});
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

  expect((await ssrTransform(code, null, null)).code).toMatchInlineSnapshot(`
    "__vite_ssr_exports__.default = (function getRandom() {
      return Math.random();
    });"
  `)

  expect(
    (await ssrTransform(`export default (class A {});`, null, null)).code
  ).toMatchInlineSnapshot(`"__vite_ssr_exports__.default = (class A {});"`)
})

// #8002
test('with hashbang', async () => {
  expect(
    (
      await ssrTransform(
        `#!/usr/bin/env node
console.log("it can parse the hashbang")`,
        null,
        null
      )
    ).code
  ).toMatchInlineSnapshot(`
    "#!/usr/bin/env node
    console.log(\\"it can parse the hashbang\\")"
  `)
})
