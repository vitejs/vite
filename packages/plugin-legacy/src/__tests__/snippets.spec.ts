import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'
import type { ecmaVersion } from 'acorn'
import { parse } from 'acorn'
import { detectModernBrowserDetector } from '../snippets'
import { cspHashes } from '..'

const shouldFailVersions: ecmaVersion[] = []
for (let v = 2015; v <= 2019; v++) {
  shouldFailVersions.push(v as ecmaVersion)
}

const shouldPassVersions: acorn.ecmaVersion[] = []
for (let v = 2020; v <= 2022; v++) {
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

test('CSP hashes in README.md should be correct', () => {
  const readme = fs
    .readFileSync(path.resolve(__dirname, '../../README.md'))
    .toString()
  const hashesInDoc = [...readme.matchAll(/`sha256-(.+)`/g)].map(
    (match) => match[1],
  )

  expect(
    cspHashes.every((hash, index) => hash === hashesInDoc[index]),
  ).toBeTruthy()
})
