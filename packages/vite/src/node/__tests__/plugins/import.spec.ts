import { beforeEach, describe, expect, onTestFinished, test, vi } from 'vitest'
import { transformCjsImport } from '../../plugins/importAnalysis'
import type { Plugin } from '../../plugin'
import { createServer } from '../../server'

describe('runTransform', () => {
  const config: any = {
    command: 'serve',
    logger: {
      warn: vi.fn(),
    },
  }

  function runTransformCjsImport(importExp: string, isNodeMode: boolean) {
    const result = transformCjsImport(
      importExp,
      './node_modules/.vite/deps/react.js',
      'react',
      0,
      'modA',
      isNodeMode,
      config,
    )
    if (result === undefined) return undefined
    const joined = result.hoistedAssignments
      ? `${result.hoistedAssignments}; ${result.importLine}`
      : result.importLine
    expect(joined.split('\n').length, 'result line count').toBe(
      importExp.split('\n').length,
    )
    return joined.replaceAll(';', ';\n')
  }

  beforeEach(() => {
    config.logger.warn.mockClear()
  })

  test('import specifier', () => {
    expect(
      runTransformCjsImport(
        'import { useState, Component, "👋" as fake } from "react"',
        false,
      ),
    ).toMatchInlineSnapshot(`
      "const useState = __vite__cjsImport0_react["useState"];
       const Component = __vite__cjsImport0_react["Component"];
       const fake = __vite__cjsImport0_react["👋"];
       import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js""
    `)
    expect(
      runTransformCjsImport(
        'import { useState, Component, "👋" as fake } from "react"',
        true,
      ),
    ).toMatchInlineSnapshot(`
      "const useState = __vite__cjsImport0_react["useState"];
       const Component = __vite__cjsImport0_react["Component"];
       const fake = __vite__cjsImport0_react["👋"];
       import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js""
    `)
  })

  test('import default specifier', () => {
    expect(runTransformCjsImport('import React from "react"', false))
      .toMatchInlineSnapshot(`
      "const React = !__vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react : __vite__cjsImport0_react.default;
       import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js""
    `)
    expect(runTransformCjsImport('import React from "react"', true))
      .toMatchInlineSnapshot(`
        "const React = __vite__cjsImport0_react;
         import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js""
      `)

    expect(
      runTransformCjsImport('import { default as React } from "react"', false),
    ).toMatchInlineSnapshot(`
      "const React = !__vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react : __vite__cjsImport0_react.default;
       import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js""
    `)
  })

  test('import all specifier', () => {
    expect(runTransformCjsImport('import * as react from "react"', false))
      .toMatchInlineSnapshot(`
      "const react = ((m, n) => n || !m?.__esModule ? {	...typeof m === "object" && !Array.isArray(m) || typeof m === "function" ? m : {},	default: m} : m)(__vite__cjsImport0_react, 0);
       import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js""
    `)
    expect(runTransformCjsImport('import * as react from "react"', true))
      .toMatchInlineSnapshot(`
        "const react = ((m, n) => n || !m?.__esModule ? {	...typeof m === "object" && !Array.isArray(m) || typeof m === "function" ? m : {},	default: m} : m)(__vite__cjsImport0_react, 1);
         import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js""
      `)
  })

  test('export all specifier', () => {
    expect(
      runTransformCjsImport('export * from "react"', false),
    ).toMatchInlineSnapshot(`undefined`)
    expect(
      runTransformCjsImport('export * from "react"', true),
    ).toMatchInlineSnapshot(`undefined`)

    expect(config.logger.warn).toBeCalledWith(
      expect.stringContaining(`export * from "react"\` in modA`),
    )

    expect(
      runTransformCjsImport('export * as react from "react"', false),
    ).toMatchInlineSnapshot(`undefined`)

    expect(config.logger.warn).toBeCalledTimes(2)
  })

  test('export name specifier', () => {
    expect(
      runTransformCjsImport(
        'export { useState, Component, "👋" } from "react"',
        false,
      ),
    ).toMatchInlineSnapshot(`
      "const __vite__cjsExportI_useState = __vite__cjsImport0_react["useState"];
       const __vite__cjsExportI_Component = __vite__cjsImport0_react["Component"];
       const __vite__cjsExportL_1d0452e3 = __vite__cjsImport0_react["👋"];
       export { __vite__cjsExportI_useState as useState, __vite__cjsExportI_Component as Component, __vite__cjsExportL_1d0452e3 as "👋" };
       import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js""
    `)
    expect(
      runTransformCjsImport(
        'export { useState, Component, "👋" } from "react"',
        true,
      ),
    ).toMatchInlineSnapshot(`
      "const __vite__cjsExportI_useState = __vite__cjsImport0_react["useState"];
       const __vite__cjsExportI_Component = __vite__cjsImport0_react["Component"];
       const __vite__cjsExportL_1d0452e3 = __vite__cjsImport0_react["👋"];
       export { __vite__cjsExportI_useState as useState, __vite__cjsExportI_Component as Component, __vite__cjsExportL_1d0452e3 as "👋" };
       import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js""
    `)

    expect(
      runTransformCjsImport(
        'export { useState as useStateAlias, Component as ComponentAlias, "👋" as "👍" } from "react"',
        false,
      ),
    ).toMatchInlineSnapshot(`
      "const __vite__cjsExportI_useStateAlias = __vite__cjsImport0_react["useState"];
       const __vite__cjsExportI_ComponentAlias = __vite__cjsImport0_react["Component"];
       const __vite__cjsExportL_5d57d39e = __vite__cjsImport0_react["👋"];
       export { __vite__cjsExportI_useStateAlias as useStateAlias, __vite__cjsExportI_ComponentAlias as ComponentAlias, __vite__cjsExportL_5d57d39e as "👍" };
       import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js""
    `)
  })

  test('export default specifier', () => {
    expect(runTransformCjsImport('export { default } from "react"', false))
      .toMatchInlineSnapshot(`
      "const __vite__cjsExportDefault_0 = !__vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react : __vite__cjsImport0_react.default;
       export default __vite__cjsExportDefault_0;
       import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js""
    `)
    expect(runTransformCjsImport('export { default } from "react"', true))
      .toMatchInlineSnapshot(`
        "const __vite__cjsExportDefault_0 = __vite__cjsImport0_react;
         export default __vite__cjsExportDefault_0;
         import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js""
      `)

    expect(
      runTransformCjsImport('export { default as React} from "react"', false),
    ).toMatchInlineSnapshot(`
      "const __vite__cjsExportI_React = !__vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react : __vite__cjsImport0_react.default;
       export { __vite__cjsExportI_React as React };
       import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js""
    `)

    expect(
      runTransformCjsImport(
        'export { Component as default } from "react"',
        false,
      ),
    ).toMatchInlineSnapshot(`
      "const __vite__cjsExportDefault_0 = __vite__cjsImport0_react["Component"];
       export default __vite__cjsExportDefault_0;
       import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js""
    `)
  })
})

describe('dynamic import detection', () => {
  // Drives the real vite:import-analysis transform over virtual `.js` modules (no mocks).
  async function transformModules(modules: Record<string, string>) {
    const plugin: Plugin = {
      name: 'test:virtual-import-methods',
      resolveId(id) {
        if (id in modules) return '\0' + id
      },
      load(id) {
        if (id[0] === '\0' && id.slice(1) in modules) {
          return modules[id.slice(1)]
        }
      },
    }
    const server = await createServer({
      configFile: false,
      root: import.meta.dirname,
      logLevel: 'error',
      plugins: [plugin],
      server: { middlewareMode: true, ws: false },
    })
    onTestFinished(() => server.close())
    const result: Record<string, string | undefined> = {}
    for (const id of Object.keys(modules)) {
      result[id] = (await server.transformRequest(id))?.code
    }
    return result
  }

  test('does not rewrite a method or shorthand named `import`', async () => {
    const result = await transformModules({
      'method-async.js':
        'export class A {\n  async import(keys, values) {\n    return keys + values\n  }\n}',
      'method-shorthand.js':
        'export const o = {\n  import(a, b) {\n    return a + b\n  },\n}',
      'method-block-comment.js':
        'export class B {\n  import(a, b) /* note */ {\n    return a + b\n  }\n}',
      'method-line-comment.js':
        'export class C {\n  import(a, b) // note\n  {\n    return a + b\n  }\n}',
      // string-literal first arg (not valid runtime JS, but exercises the misreport)
      'method-string-arg.js':
        'export class D {\n  import("key", value) {\n    return value\n  }\n}',
      'real-dynamic-import.js':
        'export function load(name) {\n  return import(name)\n}',
    })

    expect(result['method-async.js']).toContain('import(keys, values)')
    expect(result['method-async.js']).not.toContain('__vite__injectQuery')
    expect(result['method-shorthand.js']).toContain('import(a, b)')
    expect(result['method-shorthand.js']).not.toContain('__vite__injectQuery')
    expect(result['method-block-comment.js']).toContain(
      'import(a, b) /* note */',
    )
    expect(result['method-block-comment.js']).not.toContain(
      '__vite__injectQuery',
    )
    expect(result['method-line-comment.js']).toContain('import(a, b)')
    expect(result['method-line-comment.js']).not.toContain(
      '__vite__injectQuery',
    )
    expect(result['method-string-arg.js']).toContain('import("key", value)')
    expect(result['method-string-arg.js']).not.toContain('__vite__injectQuery')

    // control: a real dynamic import is still rewritten
    expect(result['real-dynamic-import.js']).toContain('__vite__injectQuery')
  })
})
