import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'
import { isBuild, readFile, serverLogs, testDir } from '~utils'

test.runIf(isBuild)('no minifySyntax', () => {
  const assetsDir = path.resolve(testDir, 'dist/assets')
  const files = fs.readdirSync(assetsDir)

  const jsFile = files.find((f) => f.endsWith('.js'))
  const jsContent = readFile(path.resolve(assetsDir, jsFile))

  const cssFile = files.find((f) => f.endsWith('.css'))
  const cssContent = readFile(path.resolve(assetsDir, cssFile))

  expect(jsContent).toContain('console.log("hello world")')
  expect(jsContent).not.toContain('/*! explicit comment */')

  expect(cssContent).toContain('color:#ff0000')
  expect(cssContent).not.toContain('/*! explicit comment */')
})

test.runIf(isBuild)('css minify warnings include source file names', () => {
  expect(serverLogs.join('\n')).toContain('test.css')
})
