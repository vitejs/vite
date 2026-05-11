import { URL } from 'node:url'
import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping'
import { expect, test } from 'vitest'
import { extractSourcemap, isBuild, page } from '~utils'

// TODO [engine:node@>=24]: Switch to RegExp.escape
const escapeRegexRE = /[-/\\^$*+?.()|[\]{}]/g
function escapeRegex(str: string): string {
  return str.replace(escapeRegexRE, '\\$&')
}

async function getDepJs(entry: string, depIdFragment: string) {
  const res = await page.request.get(new URL(entry, page.url()).href)
  const js = await res.text()
  const depUrlMatch = js.match(
    new RegExp(`from\\s+"([^"]*${depIdFragment}[^"]*)"`),
  )
  expect(depUrlMatch).toBeTruthy()

  const depUrl = depUrlMatch![1]
  expect(depUrl).toContain('/deps/')

  const depRes = await page.request.get(new URL(depUrl, page.url()).href)
  return depRes.text()
}

function expectConsoleLogArgumentMapsToOriginalX(
  depJs: string,
  generatedName: string,
) {
  const map = extractSourcemap(depJs)
  const depLines = depJs.split('\n')
  const consoleLogCallRE = new RegExp(
    `console[\\w$]*\\.\\s*log[\\w$]*\\(${escapeRegex(generatedName)}\\)`,
  )
  const generatedLine =
    depLines.findIndex((line) => consoleLogCallRE.test(line)) + 1
  expect(generatedLine).toBeGreaterThan(0)

  const generatedColumn = depLines[generatedLine - 1].indexOf(generatedName)
  expect(generatedColumn).toBeGreaterThanOrEqual(0)

  const position = originalPositionFor(new TraceMap(map), {
    line: generatedLine,
    column: generatedColumn,
  })

  expect(depJs).toMatch(
    /^\/\/# sourceMappingURL=data:application\/json;base64,/m,
  )
  expect(position).toMatchObject({
    line: 6,
    column: 16,
    name: 'x',
  })
}

test.runIf(!isBuild)(
  'babel-transformed downleveled optimized dep maps to the correct original name',
  async () => {
    const depJs = await getDepJs(
      './optimized-class-field-import-babel.js',
      'test-dep-class-field-sourcemap-babel',
    )

    expect(depJs).toContain('x = () => 1')
    expect(depJs).toContain('constructor(_x)')
    expect(depJs).toContain('console.log(_x)')
    expectConsoleLogArgumentMapsToOriginalX(depJs, '_x')
  },
)

test.runIf(!isBuild)(
  'oxc-transformed downleveled optimized dep maps to the correct original name',
  async () => {
    const depJs = await getDepJs(
      './optimized-class-field-import-oxc.js',
      'test-dep-class-field-sourcemap-oxc',
    )

    expect(depJs).toContain('x$$$ = () => 1')
    expect(depJs).toContain('constructor$$$(_x$$$)')
    expect(depJs).toContain('console$$$.log$$$(_x$$$)')
    expectConsoleLogArgumentMapsToOriginalX(depJs, '_x$$$')
  },
)
