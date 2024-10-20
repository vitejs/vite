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
  const files = fs.readdirSync(assetsDir)

  for (const fileName of files) {
    if (fileName.startsWith('LEGAL')) {
      return readFile(path.join(assetsDir, fileName))
    }
  }
}

const legalComments = '/*! explicit comment */'

describe.runIf(isBuild)('minify', () => {
  test('Do not preserve any legal comments', () => {
    const { jsContent, cssContent } = getJsAndCssContent(
      path.resolve(testDir, 'dist/none/assets'),
    )

    expect(jsContent).toContain('{console.log("hello world")}')
    expect(jsContent).not.toContain(legalComments)
    expect(cssContent).toContain('color:#ff0000')
    expect(cssContent).not.toContain(legalComments)
  })

  test('Preserve legal comments', () => {
    const { jsContent, cssContent } = getJsAndCssContent(
      path.resolve(testDir, 'dist/inline/assets'),
    )

    expect(jsContent).toContain(legalComments)
    expect(cssContent).toContain(legalComments)
  })

  test('Move all legal comments to the end of the file.', () => {
    const { jsContent, cssContent } = getJsAndCssContent(
      path.resolve(testDir, 'dist/eof/assets'),
    )

    expect(jsContent.endsWith(legalComments)).toBeTruthy()
    expect(cssContent.endsWith(legalComments)).toBeTruthy()
  })

  test('Move all legal comments to a LEGAL.txt file but to not link to them.', () => {
    const assetsPath = path.resolve(testDir, 'dist/external/assets')
    const { jsContent, cssContent } = getJsAndCssContent(assetsPath)
    const legaContent = getLegalFileContent(assetsPath)

    expect(jsContent).not.toContain(legalComments)
    expect(cssContent).not.toContain(legalComments)
    expect(legaContent).toContain(legalComments)
  })

  test('Move all legal comments to a LEGAL.txt file and link to them with a comment.', () => {
    const linkedCommentsPre = 'For license information please see'
    const assetsPath = path.resolve(testDir, 'dist/linked/assets')
    const { jsContent, cssContent } = getJsAndCssContent(assetsPath)
    const legaContent = getLegalFileContent(assetsPath)

    expect(jsContent).not.toContain(legalComments)
    expect(jsContent.includes(linkedCommentsPre)).toBeTruthy()
    expect(cssContent).not.toContain(legalComments)
    expect(cssContent.includes(linkedCommentsPre)).toBeTruthy()
    expect(legaContent).toContain(legalComments)
  })
})
