import { beforeEach, describe, expect, test, vi } from 'vitest'
import MagicString from 'magic-string'
import { transformCjsImport } from '../../plugins/importAnalysis'
import { commonjsHelperContainer } from '../../plugins/commonjsHelper'
import type { ResolvedConfig } from '../../config'

describe('transformCjsImport', () => {
  const defaultUrl = './node_modules/.vite/deps/react.js'
  const defaultRawUrl = 'react'
  const defaultConfig: any = {
    command: 'serve',
    logger: {
      warn: vi.fn(),
    },
  }

  function compiler(
    source: string,
    options?: {
      url?: string
      rawUrl?: string
      importIndex?: number
      importer?: string
      config?: ResolvedConfig
    },
  ) {
    const commonjsHelpers = new commonjsHelperContainer()
    const {
      url = defaultUrl,
      rawUrl = defaultRawUrl,
      importIndex = 0,
      importer = '',
      config = defaultConfig,
    } = options || {}
    const compilerResult = transformCjsImport(
      source,
      url,
      rawUrl,
      importIndex,
      importer,
      config,
      commonjsHelpers,
    )
    if (compilerResult) {
      const s = new MagicString(compilerResult)
      if (commonjsHelpers.collectTools.length) {
        s.prepend(commonjsHelpers.injectHelper())
      }
      return s.toString()
    }
  }

  beforeEach(() => {
    defaultConfig.logger.warn.mockClear()
  })

  test('import specifier', () => {
    expect(compiler('import { useState, Component } from "react"')).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const useState = __vite__cjsImport0_react["useState"]; ' +
        'const Component = __vite__cjsImport0_react["Component"]',
    )
  })

  test('import default specifier', () => {
    expect(compiler('import React from "react"')).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const React = __vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react.default : __vite__cjsImport0_react',
    )

    expect(compiler('import { default as React } from "react"')).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const React = __vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react.default : __vite__cjsImport0_react',
    )
  })

  test('import all specifier', () => {
    expect(compiler('import * as react from "react"')).toEqual(
      'import { mergeNamespaces as __mergeNamespaces,getDefaultExportFromCjs as __getDefaultExportFromCjs } from "/vite/commonjsHelpers";' +
        'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const react = __mergeNamespaces({ __proto__: null, default: __getDefaultExportFromCjs(__vite__cjsImport0_react)}, [__vite__cjsImport0_react]);',
    )
  })

  test('export all specifier', () => {
    expect(
      compiler('export * from "react"', {
        importer: 'modA',
      }),
    ).toBe(undefined)

    expect(defaultConfig.logger.warn).toBeCalledWith(
      expect.stringContaining(`export * from "react"\` in modA`),
    )

    expect(compiler('export * as react from "react"')).toBe(undefined)

    expect(defaultConfig.logger.warn).toBeCalledTimes(1)
  })

  test('export name specifier', () => {
    expect(compiler('export { useState, Component } from "react"')).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const __vite__cjsExport_useState = __vite__cjsImport0_react["useState"]; ' +
        'const __vite__cjsExport_Component = __vite__cjsImport0_react["Component"]; ' +
        'export { __vite__cjsExport_useState as useState, __vite__cjsExport_Component as Component }',
    )

    expect(
      compiler(
        'export { useState as useStateAlias, Component as ComponentAlias } from "react"',
      ),
    ).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const __vite__cjsExport_useStateAlias = __vite__cjsImport0_react["useState"]; ' +
        'const __vite__cjsExport_ComponentAlias = __vite__cjsImport0_react["Component"]; ' +
        'export { __vite__cjsExport_useStateAlias as useStateAlias, __vite__cjsExport_ComponentAlias as ComponentAlias }',
    )
  })

  test('export default specifier', () => {
    expect(compiler('export { default } from "react"')).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const __vite__cjsExportDefault_0 = __vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react.default : __vite__cjsImport0_react; ' +
        'export default __vite__cjsExportDefault_0',
    )

    expect(compiler('export { default as React} from "react"')).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const __vite__cjsExport_React = __vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react.default : __vite__cjsImport0_react; ' +
        'export { __vite__cjsExport_React as React }',
    )

    expect(compiler('export { Component as default } from "react"')).toBe(
      'import __vite__cjsImport0_react from "./node_modules/.vite/deps/react.js"; ' +
        'const __vite__cjsExportDefault_0 = __vite__cjsImport0_react["Component"]; ' +
        'export default __vite__cjsExportDefault_0',
    )
  })
})
