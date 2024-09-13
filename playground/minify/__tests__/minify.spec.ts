import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { isBuild, readFile, testDir } from '~utils'

function getJsAndCssContent(assetsDir: string) {
  const files = fs.readdirSync(assetsDir)

  const jsFile = files.find((f) => f.endsWith('.js'))
  const jsContent = readFile(path.resolve(assetsDir, jsFile)).trim()

  const cssFile = files.find((f) => f.endsWith('.css'))
  const cssContent = readFile(path.resolve(assetsDir, cssFile)).trim()

  return { jsContent, cssContent }
}

function getLegalFileContent(assetsDir: string) {
  return readFile(path.resolve(assetsDir, '.LEGAL.txt'))
}

describe.runIf(isBuild)('minify', () => {
  test('Do not preserve any legal comments', () => {
    const { jsContent, cssContent } = getJsAndCssContent(
      path.resolve(testDir, 'dist/none/assets'),
    )

    expect(jsContent).toContain('{console.log("hello world")}')
    expect(jsContent).not.toContain('/*! explicit comment */')

    expect(cssContent).toContain('color:#ff0000')
    expect(cssContent).not.toContain('/*! explicit comment */')
  })

  test('Preserve legal comments', () => {
    const { jsContent, cssContent } = getJsAndCssContent(
      path.resolve(testDir, 'dist/inline/assets'),
    )

    expect(jsContent).toContain('/*! explicit comment */')
    expect(cssContent).toContain('/*! explicit comment */')
  })

  test('Move all legal comments to the end of the file.', () => {
    const { jsContent, cssContent } = getJsAndCssContent(
      path.resolve(testDir, 'dist/eof/assets'),
    )
    expect(jsContent.endsWith('/*! explicit comment */')).toBeTruthy()
    expect(cssContent.endsWith('/*! explicit comment */')).toBeTruthy()
  })

  test('Move all legal comments to a .LEGAL.txt file but to not link to them.', () => {
    const { jsContent, cssContent } = getJsAndCssContent(
      path.resolve(testDir, 'dist/external/assets'),
    )
    const legaContent = getLegalFileContent(
      path.resolve(testDir, 'dist/external'),
    )
    expect(jsContent).not.toContain('/*! explicit comment */')
    expect(cssContent).not.toContain('/*! explicit comment */')
    expect(legaContent).toContain('/*! explicit comment */')
  })
})
