import { transformCjsImport } from '../../plugins/importAnalysis'

describe('transformCjsImport', () => {
  const url = './node_modules/.vite/react.js'
  const rawUrl = 'react'

  test('import specifier', () => {
    expect(
      transformCjsImport(
        'import { useState, Component } from "react"',
        url,
        rawUrl,
        0
      )
    ).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/react.js"; ' +
        'const useState = __vite__cjsImport0_react["useState"]; ' +
        'const Component = __vite__cjsImport0_react["Component"]'
    )
  })

  test('import default specifier', () => {
    expect(
      transformCjsImport('import React from "react"', url, rawUrl, 0)
    ).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/react.js"; ' +
        'const React = __vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react.default : __vite__cjsImport0_react'
    )
  })

  test('import name specifier', () => {
    expect(
      transformCjsImport('import * as react from "react"', url, rawUrl, 0)
    ).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/react.js"; ' +
        'const react = __vite__cjsImport0_react'
    )
  })

  test('export all declaration', () => {
    expect(transformCjsImport('export * from "react"', url, rawUrl, 0)).toBe(
      undefined
    )

    expect(
      transformCjsImport('export * as react from "react"', url, rawUrl, 0)
    ).toBe(undefined)
  })

  test('export name declaration', () => {
    expect(
      transformCjsImport(
        'export { useState, Component } from "react"',
        url,
        rawUrl,
        0
      )
    ).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/react.js"; ' +
        'const useState = __vite__cjsImport0_react["useState"]; ' +
        'const Component = __vite__cjsImport0_react["Component"]; ' +
        'export { useState, Component }'
    )
  })

  // expect(
  //   transformCjsImport('export { default } from "react"', url, rawUrl, 0)
  // ).toBe('import __vite__cjsImport0_react from "./node_modules/.vite/react.js"; ' +
  //   'const default = __vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react.default : __vite__cjsImport0_react; ' +
  //   'export { default }')
})
