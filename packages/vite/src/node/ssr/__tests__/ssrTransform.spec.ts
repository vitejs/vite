import { expect, test } from 'vitest'
import { transformWithEsbuild } from '../../plugins/esbuild'
import { ssrTransform } from '../ssrTransform'

const ssrTransformSimple = async (code: string, url = '') =>
  ssrTransform(code, null, url, code)
const ssrTransformSimpleCode = async (code: string, url?: string) =>
  (await ssrTransformSimple(code, url))?.code

test('default import', async () => {
  expect(
    await ssrTransformSimpleCode(`import foo from 'vue';console.log(foo.bar)`),
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\", {\\"importedNames\\":[\\"default\\"]});
    console.log(__vite_ssr_import_0__.default.bar)"
  `)
})

test('named import', async () => {
  expect(
    await ssrTransformSimpleCode(
      `import { ref } from 'vue';function foo() { return ref(0) }`,
    ),
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\", {\\"importedNames\\":[\\"ref\\"]});
    function foo() { return __vite_ssr_import_0__.ref(0) }"
  `)
})

test('namespace import', async () => {
  expect(
    await ssrTransformSimpleCode(
      `import * as vue from 'vue';function foo() { return vue.ref(0) }`,
    ),
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\");
    function foo() { return __vite_ssr_import_0__.ref(0) }"
  `)
})

test('export function declaration', async () => {
  expect(await ssrTransformSimpleCode(`export function foo() {}`))
    .toMatchInlineSnapshot(`
    "function foo() {}
    Object.defineProperty(__vite_ssr_exports__, \\"foo\\", { enumerable: true, configurable: true, get(){ return foo }});"
  `)
})

test('export class declaration', async () => {
  expect(await ssrTransformSimpleCode(`export class foo {}`))
    .toMatchInlineSnapshot(`
    "class foo {}
    Object.defineProperty(__vite_ssr_exports__, \\"foo\\", { enumerable: true, configurable: true, get(){ return foo }});"
  `)
})

test('export var declaration', async () => {
  expect(await ssrTransformSimpleCode(`export const a = 1, b = 2`))
    .toMatchInlineSnapshot(`
      "const a = 1, b = 2
      Object.defineProperty(__vite_ssr_exports__, \\"a\\", { enumerable: true, configurable: true, get(){ return a }});
      Object.defineProperty(__vite_ssr_exports__, \\"b\\", { enumerable: true, configurable: true, get(){ return b }});"
    `)
})

test('export named', async () => {
  expect(
    await ssrTransformSimpleCode(`const a = 1, b = 2; export { a, b as c }`),
  ).toMatchInlineSnapshot(`
    "const a = 1, b = 2; 
    Object.defineProperty(__vite_ssr_exports__, \\"a\\", { enumerable: true, configurable: true, get(){ return a }});
    Object.defineProperty(__vite_ssr_exports__, \\"c\\", { enumerable: true, configurable: true, get(){ return b }});"
  `)
})

test('export named from', async () => {
  expect(
    await ssrTransformSimpleCode(`export { ref, computed as c } from 'vue'`),
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\", {\\"importedNames\\":[\\"ref\\",\\"computed\\"]});

    Object.defineProperty(__vite_ssr_exports__, \\"ref\\", { enumerable: true, configurable: true, get(){ return __vite_ssr_import_0__.ref }});
    Object.defineProperty(__vite_ssr_exports__, \\"c\\", { enumerable: true, configurable: true, get(){ return __vite_ssr_import_0__.computed }});"
  `)
})

test('named exports of imported binding', async () => {
  expect(
    await ssrTransformSimpleCode(
      `import {createApp} from 'vue';export {createApp}`,
    ),
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\", {\\"importedNames\\":[\\"createApp\\"]});

    Object.defineProperty(__vite_ssr_exports__, \\"createApp\\", { enumerable: true, configurable: true, get(){ return __vite_ssr_import_0__.createApp }});"
  `)
})

test('export * from', async () => {
  expect(
    await ssrTransformSimpleCode(
      `export * from 'vue'\n` + `export * from 'react'`,
    ),
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\");
    __vite_ssr_exportAll__(__vite_ssr_import_0__);
    const __vite_ssr_import_1__ = await __vite_ssr_import__(\\"react\\");
    __vite_ssr_exportAll__(__vite_ssr_import_1__);

    "
  `)
})

test('export * as from', async () => {
  expect(await ssrTransformSimpleCode(`export * as foo from 'vue'`))
    .toMatchInlineSnapshot(`
      "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\");

      Object.defineProperty(__vite_ssr_exports__, \\"foo\\", { enumerable: true, configurable: true, get(){ return __vite_ssr_import_0__ }});"
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
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\", {\\"importedNames\\":[\\"createApp\\"]});
    const __vite_ssr_import_1__ = await __vite_ssr_import__(\\"vue\\");
    __vite_ssr_exportAll__(__vite_ssr_import_1__);
    "
  `)
})

test('hoist import to top', async () => {
  expect(
    await ssrTransformSimpleCode(
      `path.resolve('server.js');import path from 'node:path';`,
    ),
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"node:path\\", {\\"importedNames\\":[\\"default\\"]});
    __vite_ssr_import_0__.default.resolve('server.js');"
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
    Object.defineProperty(__vite_ssr_exports__, \\"i\\", { enumerable: true, configurable: true, get(){ return i }});"
  `)
  expect(result?.deps).toEqual([])
  expect(result?.dynamicDeps).toEqual(['./foo'])
})

test('do not rewrite method definition', async () => {
  const result = await ssrTransformSimple(
    `import { fn } from 'vue';class A { fn() { fn() } }`,
  )
  expect(result?.code).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\", {\\"importedNames\\":[\\"fn\\"]});
    class A { fn() { __vite_ssr_import_0__.fn() } }"
  `)
  expect(result?.deps).toEqual(['vue'])
})

test('do not rewrite when variable is in scope', async () => {
  const result = await ssrTransformSimple(
    `import { fn } from 'vue';function A(){ const fn = () => {}; return { fn }; }`,
  )
  expect(result?.code).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\", {\\"importedNames\\":[\\"fn\\"]});
    function A(){ const fn = () => {}; return { fn }; }"
  `)
  expect(result?.deps).toEqual(['vue'])
})

// #5472
test('do not rewrite when variable is in scope with object destructuring', async () => {
  const result = await ssrTransformSimple(
    `import { fn } from 'vue';function A(){ let {fn, test} = {fn: 'foo', test: 'bar'}; return { fn }; }`,
  )
  expect(result?.code).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\", {\\"importedNames\\":[\\"fn\\"]});
    function A(){ let {fn, test} = {fn: 'foo', test: 'bar'}; return { fn }; }"
  `)
  expect(result?.deps).toEqual(['vue'])
})

// #5472
test('do not rewrite when variable is in scope with array destructuring', async () => {
  const result = await ssrTransformSimple(
    `import { fn } from 'vue';function A(){ let [fn, test] = ['foo', 'bar']; return { fn }; }`,
  )
  expect(result?.code).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\", {\\"importedNames\\":[\\"fn\\"]});
    function A(){ let [fn, test] = ['foo', 'bar']; return { fn }; }"
  `)
  expect(result?.deps).toEqual(['vue'])
})

// #5727
test('rewrite variable in string interpolation in function nested arguments', async () => {
  const result = await ssrTransformSimple(
    `import { fn } from 'vue';function A({foo = \`test\${fn}\`} = {}){ return {}; }`,
  )
  expect(result?.code).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\", {\\"importedNames\\":[\\"fn\\"]});
    function A({foo = \`test\${__vite_ssr_import_0__.fn}\`} = {}){ return {}; }"
  `)
  expect(result?.deps).toEqual(['vue'])
})

// #6520
test('rewrite variables in default value of destructuring params', async () => {
  const result = await ssrTransformSimple(
    `import { fn } from 'vue';function A({foo = fn}){ return {}; }`,
  )
  expect(result?.code).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\", {\\"importedNames\\":[\\"fn\\"]});
    function A({foo = __vite_ssr_import_0__.fn}){ return {}; }"
  `)
  expect(result?.deps).toEqual(['vue'])
})

test('do not rewrite when function declaration is in scope', async () => {
  const result = await ssrTransformSimple(
    `import { fn } from 'vue';function A(){ function fn() {}; return { fn }; }`,
  )
  expect(result?.code).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\", {\\"importedNames\\":[\\"fn\\"]});
    function A(){ function fn() {}; return { fn }; }"
  `)
  expect(result?.deps).toEqual(['vue'])
})

test('do not rewrite catch clause', async () => {
  const result = await ssrTransformSimple(
    `import {error} from './dependency';try {} catch(error) {}`,
  )
  expect(result?.code).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"./dependency\\", {\\"importedNames\\":[\\"error\\"]});
    try {} catch(error) {}"
  `)
  expect(result?.deps).toEqual(['./dependency'])
})

// #2221
test('should declare variable for imported super class', async () => {
  expect(
    await ssrTransformSimpleCode(
      `import { Foo } from './dependency';` + `class A extends Foo {}`,
    ),
  ).toMatchInlineSnapshot(`
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"./dependency\\", {\\"importedNames\\":[\\"Foo\\"]});
    const Foo = __vite_ssr_import_0__.Foo;
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
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"./dependency\\", {\\"importedNames\\":[\\"Foo\\"]});
    const Foo = __vite_ssr_import_0__.Foo;
    class A extends Foo {}
    class B extends Foo {}
    Object.defineProperty(__vite_ssr_exports__, \\"B\\", { enumerable: true, configurable: true, get(){ return B }});
    Object.defineProperty(__vite_ssr_exports__, \\"default\\", { enumerable: true, configurable: true, value: A });"
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
    "function foo() {}
    foo.prototype = Object.prototype;
    Object.defineProperty(__vite_ssr_exports__, \\"default\\", { enumerable: true, configurable: true, value: foo });"
  `)
  // default named classes
  expect(
    await ssrTransformSimpleCode(
      `export default class A {}\n` + `export class B extends A {}`,
    ),
  ).toMatchInlineSnapshot(`
    "class A {}
    class B extends A {}
    Object.defineProperty(__vite_ssr_exports__, \\"B\\", { enumerable: true, configurable: true, get(){ return B }});
    Object.defineProperty(__vite_ssr_exports__, \\"default\\", { enumerable: true, configurable: true, value: A });"
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
  )?.map
  expect(map?.sources).toStrictEqual(['input.js'])
  expect(map?.sourcesContent).toStrictEqual(['export const a = 1 /* */'])
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
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\", {\\"importedNames\\":[\\"inject\\"]});
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
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"foo\\", {\\"importedNames\\":[\\"foo\\",\\"bar\\"]});


    const a = ({ _ = __vite_ssr_import_0__.foo() }) => {}
    function b({ _ = __vite_ssr_import_0__.bar() }) {}
    function c({ _ = __vite_ssr_import_0__.bar() + __vite_ssr_import_0__.foo() }) {}
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
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"foo\\", {\\"importedNames\\":[\\"n\\"]});


    const a = () => {
      const { type: n = 'bar' } = {}
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
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"foo\\", {\\"importedNames\\":[\\"n\\",\\"m\\"]});


    const foo = {}

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
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\", {\\"importedNames\\":[\\"remove\\",\\"add\\",\\"get\\",\\"set\\",\\"rest\\",\\"objRest\\"]});



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
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"foo\\", {\\"importedNames\\":[\\"default\\"]});



    const bar = 'bar'

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
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\", {\\"importedNames\\":[\\"remove\\",\\"add\\"]});



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
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"foo\\", {\\"importedNames\\":[\\"default\\"]});



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
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"vue\\", {\\"importedNames\\":[\\"aaa\\",\\"bbb\\",\\"ccc\\",\\"ddd\\"]});



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
  expect(await ssrTransformSimpleCode(result.code, '/foo.jsx'))
    .toMatchInlineSnapshot(`
      "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"react\\", {\\"importedNames\\":[\\"default\\"]});
      const __vite_ssr_import_1__ = await __vite_ssr_import__(\\"foo\\", {\\"importedNames\\":[\\"Foo\\",\\"Slot\\"]});


      function Bar({ Slot: Slot2 = /* @__PURE__ */ __vite_ssr_import_0__.default.createElement(__vite_ssr_import_1__.Foo, null) }) {
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
    console.log(\\"it can parse the hashbang\\")"
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
    const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"foo\\", {\\"importedNames\\":[\\"default\\"]});
    console.log(__vite_ssr_import_0__.default);
    "
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
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"foobar\\", {\\"importedNames\\":[\\"foo\\",\\"bar\\"]});

    if (false) {
      const foo = 'foo'
      console.log(foo)
    } else if (false) {
      const [bar] = ['bar']
      console.log(bar)
    } else {
      console.log(__vite_ssr_import_0__.foo)
      console.log(__vite_ssr_import_0__.bar)
    }
    class Test {
      constructor() {
        if (false) {
          const foo = 'foo'
          console.log(foo)
        } else if (false) {
          const [bar] = ['bar']
          console.log(bar)
        } else {
          console.log(__vite_ssr_import_0__.foo)
          console.log(__vite_ssr_import_0__.bar)
        }
      }
    }
    Object.defineProperty(__vite_ssr_exports__, \\"Test\\", { enumerable: true, configurable: true, get(){ return Test }});;"
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
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"foobar\\", {\\"importedNames\\":[\\"foo\\",\\"bar\\"]});


    function test() {
      if (true) {
        var foo = () => { var why = 'would' }, bar = 'someone'
      }
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
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"foobar\\", {\\"importedNames\\":[\\"foo\\",\\"bar\\",\\"baz\\"]});


    function test() {
      [__vite_ssr_import_0__.foo];
      {
        let foo = 10;
        let bar = 10;
      }
      try {} catch (baz){ baz };
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
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"./test.js\\", {\\"importedNames\\":[\\"test\\"]});



    for (const test of tests) {
      console.log(test)
    }

    for (let test = 0; test < 10; test++) {
      console.log(test)
    }

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
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"./foo\\", {\\"importedNames\\":[\\"default\\",\\"Bar\\"]});



    console.log(__vite_ssr_import_0__.default, __vite_ssr_import_0__.Bar);
    const obj = {
      foo: class Foo {},
      bar: class Bar {}
    }
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
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"./foo.json\\");

      
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
    "const __vite_ssr_import_0__ = await __vite_ssr_import__(\\"./foo\\", {\\"importedNames\\":[\\"foo\\"]});
    const __vite_ssr_import_1__ = await __vite_ssr_import__(\\"./a\\");
    __vite_ssr_exportAll__(__vite_ssr_import_1__);
    const __vite_ssr_import_2__ = await __vite_ssr_import__(\\"./b\\");
    __vite_ssr_exportAll__(__vite_ssr_import_2__);

    console.log(__vite_ssr_import_0__.foo + 1)



    console.log(__vite_ssr_import_0__.foo + 2)
      "
  `)
})
