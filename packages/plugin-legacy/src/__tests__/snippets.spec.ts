import { describe, expect, test } from 'vitest'
import type { ecmaVersion } from 'acorn'
import { parse } from 'acorn'
import {
  createModernChunkLegacyGuard,
  detectModernBrowserCode,
  detectModernBrowserDetector,
  dynamicFallbackInlineCode,
  safari10NoModuleFix,
  systemJSInlineCode,
} from '../snippets'

const shouldFailVersions: ecmaVersion[] = []
for (let v = 2015; v <= 2019; v++) {
  shouldFailVersions.push(v as ecmaVersion)
}

const shouldPassVersions: ecmaVersion[] = []
for (let v = 2020; v <= 2024; v++) {
  shouldPassVersions.push(v as ecmaVersion)
}

for (const version of shouldFailVersions) {
  test(`detect code should not be able to be parsed with ES${version}`, () => {
    expect(() => {
      parse(detectModernBrowserDetector, {
        ecmaVersion: version,
        sourceType: 'module',
      })
    }).toThrow()
  })
}

for (const version of shouldPassVersions) {
  test(`detect code should be able to be parsed with ES${version}`, () => {
    expect(() => {
      parse(detectModernBrowserDetector, {
        ecmaVersion: version,
        sourceType: 'module',
      })
    }).not.toThrow()
  })
}

describe('snippets are valid', () => {
  const codes = {
    safari10NoModuleFix,
    systemJSInlineCode,
    detectModernBrowserCode,
    dynamicFallbackInlineCode,
  }

  for (const [name, value] of Object.entries(codes)) {
    test(`${name} is valid JS`, () => {
      expect(() => {
        parse(value, {
          ecmaVersion: 'latest',
          sourceType: 'module',
        })
      }).not.toThrow()
    })
  }
})

describe('createModernChunkLegacyGuard', () => {
  // https://github.com/vitejs/vite/issues/22008
  test('generates unique data URLs for different chunk filenames', () => {
    const guard1 = createModernChunkLegacyGuard('assets/index-abc123.js')
    const guard2 = createModernChunkLegacyGuard('assets/chunk-def456.js')
    expect(guard1).not.toBe(guard2)
  })

  test('is valid JS', () => {
    const guard = createModernChunkLegacyGuard('assets/index-abc123.js')
    expect(() => {
      parse(guard, {
        ecmaVersion: 'latest',
        sourceType: 'module',
      })
    }).not.toThrow()
  })
})
