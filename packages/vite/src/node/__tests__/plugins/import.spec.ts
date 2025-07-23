import { beforeEach, describe, expect, test, vi } from 'vitest'
import { transformCjsImport } from '../../plugins/importAnalysis'

describe('runTransform', () => {
  const config: any = {
    command: 'serve',
    logger: {
      warn: vi.fn(),
    },
  }

  function runTransformCjsImport(importExp: string) {
    const result = transformCjsImport(
      importExp,
      './node_modules/.vite/deps/react.js',
      'react',
      0,
      'modA',
      config,
    )
    if (result !== undefined) {
      expect(result.split('\n').length, 'result line count').toBe(
        importExp.split('\n').length,
      )
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
      ),
    ).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const useState = __vite__cjsImport0_react["useState"]; ' +
        'const Component = __vite__cjsImport0_react["Component"]; ' +
        'const fake = __vite__cjsImport0_react["👋"]',
    )
  })

  test('import default specifier', () => {
    expect(runTransformCjsImport('import React from "react"')).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const React = __vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react.default : __vite__cjsImport0_react',
    )

    expect(
      runTransformCjsImport('import { default as React } from "react"'),
    ).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const React = __vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react.default : __vite__cjsImport0_react',
    )
  })

  test('import all specifier', () => {
    expect(runTransformCjsImport('import * as react from "react"')).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        `const react = ((m) => m?.__esModule ? m : {  ...typeof m === "object" && !Array.isArray(m) || typeof m === "function" ? m : {},  default: m})(__vite__cjsImport0_react)`,
    )
  })

  test('export all specifier', () => {
    expect(runTransformCjsImport('export * from "react"')).toBe(undefined)

    expect(config.logger.warn).toBeCalledWith(
      expect.stringContaining(`export * from "react"\` in modA`),
    )

    expect(runTransformCjsImport('export * as react from "react"')).toBe(
      undefined,
    )

    expect(config.logger.warn).toBeCalledTimes(1)
  })

  test('export name specifier', () => {
    expect(
      runTransformCjsImport(
        'export { useState, Component, "👋" } from "react"',
      ),
    ).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const __vite__cjsExportI_useState = __vite__cjsImport0_react["useState"]; ' +
        'const __vite__cjsExportI_Component = __vite__cjsImport0_react["Component"]; ' +
        'const __vite__cjsExportL_1d0452e3 = __vite__cjsImport0_react["👋"]; ' +
        'export { __vite__cjsExportI_useState as useState, __vite__cjsExportI_Component as Component, __vite__cjsExportL_1d0452e3 as "👋" }',
    )

    expect(
      runTransformCjsImport(
        'export { useState as useStateAlias, Component as ComponentAlias, "👋" as "👍" } from "react"',
      ),
    ).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const __vite__cjsExportI_useStateAlias = __vite__cjsImport0_react["useState"]; ' +
        'const __vite__cjsExportI_ComponentAlias = __vite__cjsImport0_react["Component"]; ' +
        'const __vite__cjsExportL_5d57d39e = __vite__cjsImport0_react["👋"]; ' +
        'export { __vite__cjsExportI_useStateAlias as useStateAlias, __vite__cjsExportI_ComponentAlias as ComponentAlias, __vite__cjsExportL_5d57d39e as "👍" }',
    )
  })

  test('export default specifier', () => {
    expect(runTransformCjsImport('export { default } from "react"')).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const __vite__cjsExportDefault_0 = __vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react.default : __vite__cjsImport0_react; ' +
        'export default __vite__cjsExportDefault_0',
    )

    expect(
      runTransformCjsImport('export { default as React} from "react"'),
    ).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const __vite__cjsExportI_React = __vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react.default : __vite__cjsImport0_react; ' +
        'export { __vite__cjsExportI_React as React }',
    )

    expect(
      runTransformCjsImport('export { Component as default } from "react"'),
    ).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const __vite__cjsExportDefault_0 = __vite__cjsImport0_react["Component"]; ' +
        'export default __vite__cjsExportDefault_0',
    )
  })
})
