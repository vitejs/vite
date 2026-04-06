import { beforeEach, describe, expect, test, vi } from 'vitest'
import { transformCjsImport } from '../../plugins/importAnalysis'

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
    if (result !== undefined) {
      // Combine import and assignments to match old format for snapshots
      const combined = result.assignments
        ? `${result.importStatement}; ${result.assignments}`
        : result.importStatement
      expect(combined.split('\n').length, 'result line count').toBe(
        importExp.split('\n').length,
      )
      return combined.replaceAll(';', ';\n')
    }
    return result
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
      "import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js";
       var useState = __vite__cjsImport0_react["useState"];
       var Component = __vite__cjsImport0_react["Component"];
       var fake = __vite__cjsImport0_react["👋"]"
    `)
    expect(
      runTransformCjsImport(
        'import { useState, Component, "👋" as fake } from "react"',
        true,
      ),
    ).toMatchInlineSnapshot(`
      "import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js";
       var useState = __vite__cjsImport0_react["useState"];
       var Component = __vite__cjsImport0_react["Component"];
       var fake = __vite__cjsImport0_react["👋"]"
    `)
  })

  test('import default specifier', () => {
    expect(runTransformCjsImport('import React from "react"', false))
      .toMatchInlineSnapshot(`
      "import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js";
       var React = !__vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react : __vite__cjsImport0_react.default"
    `)
    expect(runTransformCjsImport('import React from "react"', true))
      .toMatchInlineSnapshot(`
        "import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js";
         var React = __vite__cjsImport0_react"
      `)

    expect(
      runTransformCjsImport('import { default as React } from "react"', false),
    ).toMatchInlineSnapshot(`
      "import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js";
       var React = !__vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react : __vite__cjsImport0_react.default"
    `)
  })

  test('import all specifier', () => {
    expect(runTransformCjsImport('import * as react from "react"', false))
      .toMatchInlineSnapshot(`
      "import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js";
       var react = ((m, n) => n || !m?.__esModule ? {	...typeof m === "object" && !Array.isArray(m) || typeof m === "function" ? m : {},	default: m} : m)(__vite__cjsImport0_react, 0)"
    `)
    expect(runTransformCjsImport('import * as react from "react"', true))
      .toMatchInlineSnapshot(`
        "import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js";
         var react = ((m, n) => n || !m?.__esModule ? {	...typeof m === "object" && !Array.isArray(m) || typeof m === "function" ? m : {},	default: m} : m)(__vite__cjsImport0_react, 1)"
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
      "import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js";
       var __vite__cjsExportI_useState = __vite__cjsImport0_react["useState"];
       var __vite__cjsExportI_Component = __vite__cjsImport0_react["Component"];
       var __vite__cjsExportL_1d0452e3 = __vite__cjsImport0_react["👋"];
       export { __vite__cjsExportI_useState as useState, __vite__cjsExportI_Component as Component, __vite__cjsExportL_1d0452e3 as "👋" }"
    `)
    expect(
      runTransformCjsImport(
        'export { useState, Component, "👋" } from "react"',
        true,
      ),
    ).toMatchInlineSnapshot(`
      "import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js";
       var __vite__cjsExportI_useState = __vite__cjsImport0_react["useState"];
       var __vite__cjsExportI_Component = __vite__cjsImport0_react["Component"];
       var __vite__cjsExportL_1d0452e3 = __vite__cjsImport0_react["👋"];
       export { __vite__cjsExportI_useState as useState, __vite__cjsExportI_Component as Component, __vite__cjsExportL_1d0452e3 as "👋" }"
    `)

    expect(
      runTransformCjsImport(
        'export { useState as useStateAlias, Component as ComponentAlias, "👋" as "👍" } from "react"',
        false,
      ),
    ).toMatchInlineSnapshot(`
      "import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js";
       var __vite__cjsExportI_useStateAlias = __vite__cjsImport0_react["useState"];
       var __vite__cjsExportI_ComponentAlias = __vite__cjsImport0_react["Component"];
       var __vite__cjsExportL_5d57d39e = __vite__cjsImport0_react["👋"];
       export { __vite__cjsExportI_useStateAlias as useStateAlias, __vite__cjsExportI_ComponentAlias as ComponentAlias, __vite__cjsExportL_5d57d39e as "👍" }"
    `)
  })

  test('export default specifier', () => {
    expect(runTransformCjsImport('export { default } from "react"', false))
      .toMatchInlineSnapshot(`
      "import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js";
       var __vite__cjsExportDefault_0 = !__vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react : __vite__cjsImport0_react.default;
       export default __vite__cjsExportDefault_0"
    `)
    expect(runTransformCjsImport('export { default } from "react"', true))
      .toMatchInlineSnapshot(`
        "import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js";
         var __vite__cjsExportDefault_0 = __vite__cjsImport0_react;
         export default __vite__cjsExportDefault_0"
      `)

    expect(
      runTransformCjsImport('export { default as React} from "react"', false),
    ).toMatchInlineSnapshot(`
      "import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js";
       var __vite__cjsExportI_React = !__vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react : __vite__cjsImport0_react.default;
       export { __vite__cjsExportI_React as React }"
    `)

    expect(
      runTransformCjsImport(
        'export { Component as default } from "react"',
        false,
      ),
    ).toMatchInlineSnapshot(`
      "import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js";
       var __vite__cjsExportDefault_0 = __vite__cjsImport0_react["Component"];
       export default __vite__cjsExportDefault_0"
    `)
  })

  test('hoisting behavior - var is hoisted', () => {
    // This test verifies that using `var` allows the binding to be used
    // before the import statement (after hoisting), avoiding TDZ errors
    expect(runTransformCjsImport('import ms from "ms"', false))
      .toMatchInlineSnapshot(`
      "import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js";
       var ms = !__vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react : __vite__cjsImport0_react.default"
    `)

    // For named imports as well
    expect(runTransformCjsImport('import { useState } from "react"', false))
      .toMatchInlineSnapshot(`
      "import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js";
       var useState = __vite__cjsImport0_react["useState"]"
    `)
  })
})
