import { describe, expect, test } from 'vitest'
import { transformCjsImport } from '../../plugins/importAnalysis'

describe('transformCjsImport', () => {
  const url = './node_modules/.vite/deps/react.js'
  const rawUrl = 'react'

  test('import specifier', () => {
    expect(
      transformCjsImport(
        'import { useState, Component } from "react"',
        url,
        rawUrl,
        0,
      ),
    ).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const useState = __vite__cjsImport0_react["useState"]; ' +
        'const Component = __vite__cjsImport0_react["Component"]',
    )
  })

  test('import default specifier', () => {
    expect(
      transformCjsImport('import React from "react"', url, rawUrl, 0),
    ).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const React = __vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react.default : __vite__cjsImport0_react',
    )

    expect(
      transformCjsImport(
        'import { default as React } from "react"',
        url,
        rawUrl,
        0,
      ),
    ).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const React = __vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react.default : __vite__cjsImport0_react',
    )
  })

  test('import all specifier', () => {
    expect(
      transformCjsImport('import * as react from "react"', url, rawUrl, 0),
    ).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const react = __vite__cjsImport0_react',
    )
  })

  test('export all specifier', () => {
    expect(transformCjsImport('export * from "react"', url, rawUrl, 0)).toBe(
      undefined,
    )

    expect(
      transformCjsImport('export * as react from "react"', url, rawUrl, 0),
    ).toBe(undefined)
  })

  test('export name specifier', () => {
    expect(
      transformCjsImport(
        'export { useState, Component } from "react"',
        url,
        rawUrl,
        0,
      ),
    ).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const __vite__cjsExport_useState = __vite__cjsImport0_react["useState"]; ' +
        'const __vite__cjsExport_Component = __vite__cjsImport0_react["Component"]; ' +
        'export { __vite__cjsExport_useState as useState, __vite__cjsExport_Component as Component }',
    )

    expect(
      transformCjsImport(
        'export { useState as useStateAlias, Component as ComponentAlias } from "react"',
        url,
        rawUrl,
        0,
      ),
    ).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const __vite__cjsExport_useStateAlias = __vite__cjsImport0_react["useState"]; ' +
        'const __vite__cjsExport_ComponentAlias = __vite__cjsImport0_react["Component"]; ' +
        'export { __vite__cjsExport_useStateAlias as useStateAlias, __vite__cjsExport_ComponentAlias as ComponentAlias }',
    )
  })

  test('export default specifier', () => {
    expect(
      transformCjsImport('export { default } from "react"', url, rawUrl, 0),
    ).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const __vite__cjsExportDefault_0 = __vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react.default : __vite__cjsImport0_react; ' +
        'export default __vite__cjsExportDefault_0',
    )

    expect(
      transformCjsImport(
        'export { default as React} from "react"',
        url,
        rawUrl,
        0,
      ),
    ).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const __vite__cjsExport_React = __vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react.default : __vite__cjsImport0_react; ' +
        'export { __vite__cjsExport_React as React }',
    )

    expect(
      transformCjsImport(
        'export { Component as default } from "react"',
        url,
        rawUrl,
        0,
      ),
    ).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const __vite__cjsExportDefault_0 = __vite__cjsImport0_react["Component"]; ' +
        'export default __vite__cjsExportDefault_0',
    )
  })
})
