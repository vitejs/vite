import { URL, fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { execFile } from 'node:child_process'
import { describe, expect, test } from 'vitest'
import { mapFileCommentRegex } from 'convert-source-map'
import { commentSourceMap } from '../foo-with-sourcemap-plugin'
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
    const map = extractSourcemap(js)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      {
        "mappings": "AAAA,MAAM,CAAC,KAAK,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC;",
        "sources": [
          "foo.js",
        ],
        "sourcesContent": [
          "export const foo = 'foo'
      ",
        ],
        "version": 3,
      }
    `)
  })

  test('plugin return sourcemap with `sources: [""]`', async () => {
    const res = await page.request.get(new URL('./zoo.js', page.url()).href)
    const js = await res.text()
    expect(js).toContain('// add comment')

    const map = extractSourcemap(js)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      {
        "mappings": "AAAA,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;",
        "sources": [
          "zoo.js",
        ],
        "sourcesContent": [
          "export const zoo = 'zoo'
      ",
        ],
        "version": 3,
      }
    `)
  })

  test('js with inline sourcemap injected by a plugin', async () => {
    const res = await page.request.get(
      new URL('./foo-with-sourcemap.js', page.url()).href,
    )
    const js = await res.text()

    expect(js).toContain(commentSourceMap)
    const sourcemapComments = js.match(mapFileCommentRegex).length
    expect(sourcemapComments).toBe(1)

    const map = extractSourcemap(js)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      {
        "mappings": "AAAA,MAAM,CAAC,KAAK,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,GAAG",
        "sources": [
          "",
        ],
        "version": 3,
      }
    `)
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

  test('multiline import', async () => {
    const res = await page.request.get(
      new URL('./with-multiline-import.ts', page.url()).href,
    )
    const multi = await res.text()
    const map = extractSourcemap(multi)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      {
        "mappings": "AACA;AAAA,EACE;AAAA,OACK;AAEP,QAAQ,IAAI,yBAAyB,GAAG;",
        "sources": [
          "with-multiline-import.ts",
        ],
        "sourcesContent": [
          "// prettier-ignore
      import {
        foo
      } from '@vitejs/test-importee-pkg'

      console.log('with-multiline-import', foo)
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
    const map = findAssetFile(/after-preload-dynamic-[-\w]{8}\.js\.map/)
    expect(formatSourcemapForSnapshot(JSON.parse(map))).toMatchInlineSnapshot(`
      {
        "ignoreList": [],
        "mappings": ";s8BAAA,OAAO,2BAAuB,EAAC,wBAE/B,QAAQ,IAAI,uBAAuB",
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
    // verify sourcemap comment is preserved at the last line
    const js = findAssetFile(/after-preload-dynamic-[-\w]{8}\.js$/)
    expect(js).toMatch(
      /\n\/\/# sourceMappingURL=after-preload-dynamic-[-\w]{8}\.js\.map\n$/,
    )
  })

  test('__vite__mapDeps injected after banner', async () => {
    const js = findAssetFile(/after-preload-dynamic-hashbang-[-\w]{8}\.js$/)
    expect(js.split('\n').slice(0, 2)).toEqual([
      '#!/usr/bin/env node',
      expect.stringContaining('const __vite__mapDeps=(i'),
    ])
  })

  test('no unused __vite__mapDeps', async () => {
    const js = findAssetFile(/after-preload-dynamic-no-dep-[-\w]{8}\.js$/)
    expect(js).not.toMatch(/__vite__mapDeps/)
  })

  test('sourcemap is correct when using object as "define" value', async () => {
    const map = findAssetFile(/with-define-object.*\.js\.map/)
    expect(formatSourcemapForSnapshot(JSON.parse(map))).toMatchInlineSnapshot(`
      {
        "mappings": "qBAEA,SAASA,GAAO,CACJC,GACZ,CAEA,SAASA,GAAY,CAEX,QAAA,MAAM,qBAAsBC,CAAkB,CACxD,CAEAF,EAAK",
        "sources": [
          "../../with-define-object.ts",
        ],
        "sourcesContent": [
          "// test complicated stack since broken sourcemap
      // might still look correct with a simple case
      function main() {
        mainInner()
      }

      function mainInner() {
        // @ts-expect-error "define"
        console.trace('with-define-object', __testDefineObject)
      }

      main()
      ",
        ],
        "version": 3,
      }
    `)
  })

  test('correct sourcemap during ssr dev when using object as "define" value', async () => {
    const execFileAsync = promisify(execFile)
    await execFileAsync('node', ['test-ssr-dev.js'], {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
    })
  })
})
