import { init, parse as parseImports } from 'es-module-lexer'
import MagicString from 'magic-string'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  interopNamedImports,
  transformCjsImport,
} from '../../plugins/importAnalysis'

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
    expect(joined.split('\n'), 'result line count').toHaveLength(
      importExp.split('\n').length,
    )
    return joined.replaceAll(';', ';\n')
  }

  beforeEach(() => {
    config.logger.warn.mockClear()
  })

  describe('escaped URLs', async () => {
    await init()
    const url = '/node_modules/.vite/deps/dep\'"\\\n\r\t.js'

    for (const source of [
      'import "dep"',
      'import value from "dep"',
      'import(\n  "dep"\n)',
      "export * from 'dep'",
      'export * from "dep"',
      "export * from 'de\\\np'",
    ]) {
      test(`preserves the URL and line count in ${source}`, () => {
        const str = new MagicString(source)
        const [imports] = parseImports(source)
        interopNamedImports(str, imports[0], url, 0, 'modA', false, config)
        const code = str.toString()
        const [rewrittenImports] = parseImports(code)
        expect(
          rewrittenImports.map((specifier) => specifier.specifier),
        ).toStrictEqual([url])
        // keep the number of lines for sourcemap
        expect(code.split('\n')).toHaveLength(source.split('\n').length)
      })
    }
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

  test('import specifier with escaped characters', () => {
    expect(
      runTransformCjsImport(
        `import { "quo\\"te" as quoted, 'new\\nline' as newline } from "react"`,
        false,
      ),
    ).toMatchInlineSnapshot(`
      "const quoted = __vite__cjsImport0_react["quo\\"te"];
       const newline = __vite__cjsImport0_react["new\\nline"];
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
