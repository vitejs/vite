import { URL } from 'node:url'
import { describe, expect, test } from 'vitest'
import {
  extractSourcemap,
  findAssetFile,
  formatSourcemapForSnapshot,
  isBuild,
  page,
  serverLogs,
} from '~utils'

if (!isBuild) {
  test('js', async () => {
    const res = await page.request.get(new URL('./foo.js', page.url()).href)
    const js = await res.text()
    const lines = js.split('\n')
    expect(lines[lines.length - 1].includes('//')).toBe(false) // expect no sourcemap
  })

  test('ts', async () => {
    const res = await page.request.get(new URL('./bar.ts', page.url()).href)
    const js = await res.text()
    const map = extractSourcemap(js)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      {
        "mappings": "AAAO,aAAM,MAAM;",
        "sources": [
          "bar.ts",
        ],
        "sourcesContent": [
          "export const bar = 'bar'
      ",
        ],
        "version": 3,
      }
    `)
  })

  test('should not output missing source file warning', () => {
    serverLogs.forEach((log) => {
      expect(log).not.toMatch(/Sourcemap for .+ points to missing source files/)
    })
  })
}

describe.runIf(isBuild)('build tests', () => {
  test('should not output sourcemap warning (#4939)', () => {
    serverLogs.forEach((log) => {
      expect(log).not.toMatch('Sourcemap is likely to be incorrect')
    })
  })

  test('sourcemap is correct when preload information is injected', async () => {
    const map = findAssetFile(/after-preload-dynamic.*\.js\.map/)
    expect(formatSourcemapForSnapshot(JSON.parse(map))).toMatchInlineSnapshot(`
      {
        "mappings": "stBAAAA,aAAO,2BAAuB,EAAC,sEAE/B,QAAQ,IAAI,uBAAuB",
        "sources": [
          "../../after-preload-dynamic.js",
        ],
        "sourcesContent": [
          "import('./dynamic/dynamic-foo')

      console.log('after preload dynamic')
      ",
        ],
        "version": 3,
      }
    `)
  })
})
