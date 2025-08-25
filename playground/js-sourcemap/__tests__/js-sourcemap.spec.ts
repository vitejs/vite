import { URL, fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { mapFileCommentRegex } from 'convert-source-map'
import { commentSourceMap } from '../foo-with-sourcemap-plugin'
import {
  extractSourcemap,
  findAssetFile,
  formatSourcemapForSnapshot,
  isBuild,
  listAssets,
  page,
  readFile,
  serverLogs,
} from '~utils'

if (!isBuild) {
  test('js', async () => {
    const res = await page.request.get(new URL('./foo.js', page.url()).href)
    const js = await res.text()
    const map = extractSourcemap(js)
    expect(formatSourcemapForSnapshot(map, js)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "mappings": "AAAA,MAAM,CAAC,KAAK,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,GAAG;",
          "sources": [
            "foo.js",
          ],
          "sourcesContent": [
            "export const foo = 'foo'
      ",
          ],
          "version": 3,
        },
        visualization: "https://evanw.github.io/source-map-visualization/#MjUAZXhwb3J0IGNvbnN0IGZvbyA9ICdmb28nCjE1MQB7InZlcnNpb24iOjMsInNvdXJjZXMiOlsiZm9vLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBmb28gPSAnZm9vJ1xuIl0sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHOyJ9"
      }
    `)
  })

  test('plugin return sourcemap with `sources: [""]`', async () => {
    const res = await page.request.get(new URL('./zoo.js', page.url()).href)
    const js = await res.text()
    expect(js).toContain('// add comment')

    const map = extractSourcemap(js)
    expect(formatSourcemapForSnapshot(map, js)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "mappings": "AAAA,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;",
          "sources": [
            "zoo.js",
          ],
          "sourcesContent": [
            "export const zoo = 'zoo'
      ",
          ],
          "version": 3,
        },
        visualization: "https://evanw.github.io/source-map-visualization/#NDAAZXhwb3J0IGNvbnN0IHpvbyA9ICd6b28nCi8vIGFkZCBjb21tZW50CjIxNgB7InZlcnNpb24iOjMsInNvdXJjZXMiOlsiem9vLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCB6b28gPSAnem9vJ1xuIl0sIm1hcHBpbmdzIjoiQUFBQSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7In0="
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
    expect(formatSourcemapForSnapshot(map, js)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "mappings": "AAAA,MAAM,CAAC,KAAK,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,GAAG",
          "sources": [
            "",
          ],
          "version": 3,
        },
        visualization: "https://evanw.github.io/source-map-visualization/#NzMAZXhwb3J0IGNvbnN0IGZvbyA9ICdmb28nCi8vIGRlZmF1bHQgYm91bmRhcnkgc291cmNlbWFwIHdpdGggbWFnaWMtc3RyaW5nCjk2AHsidmVyc2lvbiI6Mywic291cmNlcyI6WyIiXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcifQ=="
      }
    `)
  })

  test('ts', async () => {
    const res = await page.request.get(new URL('./bar.ts', page.url()).href)
    const js = await res.text()
    const map = extractSourcemap(js)
    expect(formatSourcemapForSnapshot(map, js)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "mappings": "AAAA,OAAO,MAAM,MAAM",
          "sources": [
            "bar.ts",
          ],
          "sourcesContent": [
            "export const bar = 'bar'
      ",
          ],
          "version": 3,
        },
        visualization: "https://evanw.github.io/source-map-visualization/#MjYAZXhwb3J0IGNvbnN0IGJhciA9ICJiYXIiOwoxMTUAeyJtYXBwaW5ncyI6IkFBQUEsT0FBTyxNQUFNLE1BQU0iLCJzb3VyY2VzIjpbImJhci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgYmFyID0gJ2JhcidcbiJdLCJ2ZXJzaW9uIjozfQ=="
      }
    `)
  })

  test('multiline import', async () => {
    const res = await page.request.get(
      new URL('./with-multiline-import.ts', page.url()).href,
    )
    const js = await res.text()
    const map = extractSourcemap(js)
    expect(formatSourcemapForSnapshot(map, js)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "mappings": ";AACA,SACE,WACK;AAEP,QAAQ,IAAI,yBAAyB",
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
        },
        visualization: "https://evanw.github.io/source-map-visualization/#MjQ4AC8vIHByZXR0aWVyLWlnbm9yZQppbXBvcnQgX192aXRlX19janNJbXBvcnQwX192aXRlanNfdGVzdEltcG9ydGVlUGtnIGZyb20gIi9ub2RlX21vZHVsZXMvLnZpdGUvZGVwcy9Adml0ZWpzX3Rlc3QtaW1wb3J0ZWUtcGtnLmpzP3Y9MDAwMDAwMDAiOyBjb25zdCBmb28gPSBfX3ZpdGVfX2Nqc0ltcG9ydDBfX3ZpdGVqc190ZXN0SW1wb3J0ZWVQa2dbImZvbyJdOwpjb25zb2xlLmxvZygid2l0aC1tdWx0aWxpbmUtaW1wb3J0IiwgZm9vKTsKMjQzAHsibWFwcGluZ3MiOiI7QUFDQSxTQUNFLFdBQ0s7QUFFUCxRQUFRLElBQUkseUJBQXlCIiwic291cmNlcyI6WyJ3aXRoLW11bHRpbGluZS1pbXBvcnQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gcHJldHRpZXItaWdub3JlXG5pbXBvcnQge1xuICBmb29cbn0gZnJvbSAnQHZpdGVqcy90ZXN0LWltcG9ydGVlLXBrZydcblxuY29uc29sZS5sb2coJ3dpdGgtbXVsdGlsaW5lLWltcG9ydCcsIGZvbylcbiJdLCJ2ZXJzaW9uIjozfQ=="
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
    const js = findAssetFile(/after-preload-dynamic-[-\w]{8}\.js$/)
    const map = findAssetFile(/after-preload-dynamic-[-\w]{8}\.js\.map/)
    if (process.env._VITE_TEST_JS_PLUGIN) {
      expect(formatSourcemapForSnapshot(JSON.parse(map), js))
        .toMatchInlineSnapshot(`
          SourceMap {
            content: {
              "debugId": "00000000-0000-0000-0000-000000000000",
              "ignoreList": [],
              "mappings": ";grCAAA,OAAO,6BAAuB,wBAE9B,QAAQ,IAAI",
              "sources": [
                "../../after-preload-dynamic.js",
              ],
              "sourcesContent": [
                "import('./dynamic/dynamic-foo')

          console.log('after preload dynamic')
          ",
              ],
              "version": 3,
            },
            visualization: "https://evanw.github.io/source-map-visualization/#MTU2NQBjb25zdCBfX3ZpdGVfX21hcERlcHM9KGksbT1fX3ZpdGVfX21hcERlcHMsZD0obS5mfHwobS5mPVsiYXNzZXRzL2R5bmFtaWMtZm9vLUNlak9nenJ4LmpzIiwiYXNzZXRzL2R5bmFtaWMtZm9vLURzcUtSckV5LmNzcyJdKSkpPT5pLm1hcChpPT5kW2ldKTsKY29uc3QgZT1mdW5jdGlvbihlKXtyZXR1cm5gL2ArZX0sdD17fSxuPWZ1bmN0aW9uKG4scixpKXtsZXQgYT1Qcm9taXNlLnJlc29sdmUoKTtpZihyJiZyLmxlbmd0aD4wKXtsZXQgbj1kb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShgbGlua2ApLG89ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgbWV0YVtwcm9wZXJ0eT1jc3Atbm9uY2VdYCkscz1vPy5ub25jZXx8bz8uZ2V0QXR0cmlidXRlKGBub25jZWApO2Z1bmN0aW9uIGMoZSl7cmV0dXJuIFByb21pc2UuYWxsKGUubWFwKGU9PlByb21pc2UucmVzb2x2ZShlKS50aGVuKGU9Pih7c3RhdHVzOmBmdWxmaWxsZWRgLHZhbHVlOmV9KSxlPT4oe3N0YXR1czpgcmVqZWN0ZWRgLHJlYXNvbjplfSkpKSl9YT1jKHIubWFwKHI9PntpZihyPWUocixpKSxyIGluIHQpcmV0dXJuO3Rbcl09ITA7bGV0IGE9ci5lbmRzV2l0aChgLmNzc2ApLG89YT9gW3JlbD0ic3R5bGVzaGVldCJdYDpgYCxjPSEhaTtpZihjKWZvcihsZXQgZT1uLmxlbmd0aC0xO2U+PTA7ZS0tKXtsZXQgdD1uW2VdO2lmKHQuaHJlZj09PXImJighYXx8dC5yZWw9PT1gc3R5bGVzaGVldGApKXJldHVybn1lbHNlIGlmKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYGxpbmtbaHJlZj0iJHtyfSJdJHtvfWApKXJldHVybjtsZXQgbD1kb2N1bWVudC5jcmVhdGVFbGVtZW50KGBsaW5rYCk7aWYobC5yZWw9YT9gc3R5bGVzaGVldGA6YG1vZHVsZXByZWxvYWRgLGF8fChsLmFzPWBzY3JpcHRgKSxsLmNyb3NzT3JpZ2luPWBgLGwuaHJlZj1yLHMmJmwuc2V0QXR0cmlidXRlKGBub25jZWAscyksZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChsKSxhKXJldHVybiBuZXcgUHJvbWlzZSgoZSx0KT0+e2wuYWRkRXZlbnRMaXN0ZW5lcihgbG9hZGAsZSksbC5hZGRFdmVudExpc3RlbmVyKGBlcnJvcmAsKCk9PnQoRXJyb3IoYFVuYWJsZSB0byBwcmVsb2FkIENTUyBmb3IgJHtyfWApKSl9KX0pKX1mdW5jdGlvbiBvKGUpe2xldCB0PW5ldyBFdmVudChgdml0ZTpwcmVsb2FkRXJyb3JgLHtjYW5jZWxhYmxlOiEwfSk7aWYodC5wYXlsb2FkPWUsd2luZG93LmRpc3BhdGNoRXZlbnQodCksIXQuZGVmYXVsdFByZXZlbnRlZCl0aHJvdyBlfXJldHVybiBhLnRoZW4oZT0+e2ZvcihsZXQgdCBvZiBlfHxbXSl7aWYodC5zdGF0dXMhPT1gcmVqZWN0ZWRgKWNvbnRpbnVlO28odC5yZWFzb24pfXJldHVybiBuKCkuY2F0Y2gobyl9KX07bigoKT0+aW1wb3J0KGAuL2R5bmFtaWMtZm9vLUNlak9nenJ4LmpzYCksX192aXRlX19tYXBEZXBzKFswLDFdKSksY29uc29sZS5sb2coYGFmdGVyIHByZWxvYWQgZHluYW1pY2ApO2V4cG9ydHtuIGFzIGJ9OwovLyMgZGVidWdJZD01ZDczODRlYS1kMzg2LTQ3YTItODNiYi1iNjkwY2I4ZThjNjEKLy8jIHNvdXJjZU1hcHBpbmdVUkw9YWZ0ZXItcHJlbG9hZC1keW5hbWljLUJkYzRUcTA0LmpzLm1hcDI2OAB7InZlcnNpb24iOjMsIm1hcHBpbmdzIjoiO2dyQ0FBQSxPQUFPLDZCQUF1Qix3QkFFOUIsUUFBUSxJQUFJIiwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiLi4vLi4vYWZ0ZXItcHJlbG9hZC1keW5hbWljLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCgnLi9keW5hbWljL2R5bmFtaWMtZm9vJylcblxuY29uc29sZS5sb2coJ2FmdGVyIHByZWxvYWQgZHluYW1pYycpXG4iXSwiZGVidWdJZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCJ9"
          }
        `)
    } else {
      expect(formatSourcemapForSnapshot(JSON.parse(map), js))
        .toMatchInlineSnapshot(`
        SourceMap {
          content: {
            "debugId": "00000000-0000-0000-0000-000000000000",
            "ignoreList": [],
            "mappings": ";grCAAA,OAAO,qDAEP,QAAQ,IAAI",
            "sources": [
              "../../after-preload-dynamic.js",
            ],
            "sourcesContent": [
              "import('./dynamic/dynamic-foo')

        console.log('after preload dynamic')
        ",
            ],
            "version": 3,
          },
          visualization: "https://evanw.github.io/source-map-visualization/#MTU2NQBjb25zdCBfX3ZpdGVfX21hcERlcHM9KGksbT1fX3ZpdGVfX21hcERlcHMsZD0obS5mfHwobS5mPVsiYXNzZXRzL2R5bmFtaWMtZm9vLUNlak9nenJ4LmpzIiwiYXNzZXRzL2R5bmFtaWMtZm9vLURzcUtSckV5LmNzcyJdKSkpPT5pLm1hcChpPT5kW2ldKTsKY29uc3QgZT1mdW5jdGlvbihlKXtyZXR1cm5gL2ArZX0sdD17fSxuPWZ1bmN0aW9uKG4scixpKXtsZXQgYT1Qcm9taXNlLnJlc29sdmUoKTtpZihyJiZyLmxlbmd0aD4wKXtsZXQgbj1kb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShgbGlua2ApLG89ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgbWV0YVtwcm9wZXJ0eT1jc3Atbm9uY2VdYCkscz1vPy5ub25jZXx8bz8uZ2V0QXR0cmlidXRlKGBub25jZWApO2Z1bmN0aW9uIGMoZSl7cmV0dXJuIFByb21pc2UuYWxsKGUubWFwKGU9PlByb21pc2UucmVzb2x2ZShlKS50aGVuKGU9Pih7c3RhdHVzOmBmdWxmaWxsZWRgLHZhbHVlOmV9KSxlPT4oe3N0YXR1czpgcmVqZWN0ZWRgLHJlYXNvbjplfSkpKSl9YT1jKHIubWFwKHI9PntpZihyPWUocixpKSxyIGluIHQpcmV0dXJuO3Rbcl09ITA7bGV0IGE9ci5lbmRzV2l0aChgLmNzc2ApLG89YT9gW3JlbD0ic3R5bGVzaGVldCJdYDpgYCxjPSEhaTtpZihjKWZvcihsZXQgZT1uLmxlbmd0aC0xO2U+PTA7ZS0tKXtsZXQgdD1uW2VdO2lmKHQuaHJlZj09PXImJighYXx8dC5yZWw9PT1gc3R5bGVzaGVldGApKXJldHVybn1lbHNlIGlmKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYGxpbmtbaHJlZj0iJHtyfSJdJHtvfWApKXJldHVybjtsZXQgbD1kb2N1bWVudC5jcmVhdGVFbGVtZW50KGBsaW5rYCk7aWYobC5yZWw9YT9gc3R5bGVzaGVldGA6YG1vZHVsZXByZWxvYWRgLGF8fChsLmFzPWBzY3JpcHRgKSxsLmNyb3NzT3JpZ2luPWBgLGwuaHJlZj1yLHMmJmwuc2V0QXR0cmlidXRlKGBub25jZWAscyksZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChsKSxhKXJldHVybiBuZXcgUHJvbWlzZSgoZSx0KT0+e2wuYWRkRXZlbnRMaXN0ZW5lcihgbG9hZGAsZSksbC5hZGRFdmVudExpc3RlbmVyKGBlcnJvcmAsKCk9PnQoRXJyb3IoYFVuYWJsZSB0byBwcmVsb2FkIENTUyBmb3IgJHtyfWApKSl9KX0pKX1mdW5jdGlvbiBvKGUpe2xldCB0PW5ldyBFdmVudChgdml0ZTpwcmVsb2FkRXJyb3JgLHtjYW5jZWxhYmxlOiEwfSk7aWYodC5wYXlsb2FkPWUsd2luZG93LmRpc3BhdGNoRXZlbnQodCksIXQuZGVmYXVsdFByZXZlbnRlZCl0aHJvdyBlfXJldHVybiBhLnRoZW4oZT0+e2ZvcihsZXQgdCBvZiBlfHxbXSl7aWYodC5zdGF0dXMhPT1gcmVqZWN0ZWRgKWNvbnRpbnVlO28odC5yZWFzb24pfXJldHVybiBuKCkuY2F0Y2gobyl9KX07bigoKT0+aW1wb3J0KGAuL2R5bmFtaWMtZm9vLUNlak9nenJ4LmpzYCksX192aXRlX19tYXBEZXBzKFswLDFdKSksY29uc29sZS5sb2coYGFmdGVyIHByZWxvYWQgZHluYW1pY2ApO2V4cG9ydHtuIGFzIGJ9OwovLyMgZGVidWdJZD01ZDczODRlYS1kMzg2LTQ3YTItODNiYi1iNjkwY2I4ZThjNjEKLy8jIHNvdXJjZU1hcHBpbmdVUkw9YWZ0ZXItcHJlbG9hZC1keW5hbWljLUJkYzRUcTA0LmpzLm1hcDI2MAB7InZlcnNpb24iOjMsIm1hcHBpbmdzIjoiO2dyQ0FBQSxPQUFPLHFEQUVQLFFBQVEsSUFBSSIsImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIi4uLy4uL2FmdGVyLXByZWxvYWQtZHluYW1pYy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQoJy4vZHluYW1pYy9keW5hbWljLWZvbycpXG5cbmNvbnNvbGUubG9nKCdhZnRlciBwcmVsb2FkIGR5bmFtaWMnKVxuIl0sImRlYnVnSWQiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDAifQ=="
        }
      `)
    }
    // verify sourcemap comment is preserved at the last line
    expect(js).toMatch(
      /\n\/\/# sourceMappingURL=after-preload-dynamic-[-\w]{8}\.js\.map\n?$/,
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
    const js = findAssetFile(/with-define-object.*\.js$/)
    const map = findAssetFile(/with-define-object.*\.js\.map/)
    expect(formatSourcemapForSnapshot(JSON.parse(map), js))
      .toMatchInlineSnapshot(`
        SourceMap {
          content: {
            "debugId": "00000000-0000-0000-0000-000000000000",
            "mappings": "AAEA,SAAS,GAAO,CACd,IAGF,SAAS,GAAY,CAEnB,QAAQ,MAAM,qBAAA,CAAA,MAAA,SAGhB",
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
          },
          visualization: "https://evanw.github.io/source-map-visualization/#MTkwAGZ1bmN0aW9uIGUoKXt0KCl9ZnVuY3Rpb24gdCgpe2NvbnNvbGUudHJhY2UoYHdpdGgtZGVmaW5lLW9iamVjdGAse2hlbGxvOmB0ZXN0YH0pfWUoKTsKLy8jIGRlYnVnSWQ9OThkZWUzNDEtYTA2Ni00MzFkLWFmMDUtNzk1ZWE5ZmM2NTA5Ci8vIyBzb3VyY2VNYXBwaW5nVVJMPXdpdGgtZGVmaW5lLW9iamVjdC1DWTN1TkJvRy5qcy5tYXA0NzkAeyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3dpdGgtZGVmaW5lLW9iamVjdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0ZXN0IGNvbXBsaWNhdGVkIHN0YWNrIHNpbmNlIGJyb2tlbiBzb3VyY2VtYXBcbi8vIG1pZ2h0IHN0aWxsIGxvb2sgY29ycmVjdCB3aXRoIGEgc2ltcGxlIGNhc2VcbmZ1bmN0aW9uIG1haW4oKSB7XG4gIG1haW5Jbm5lcigpXG59XG5cbmZ1bmN0aW9uIG1haW5Jbm5lcigpIHtcbiAgLy8gQHRzLWV4cGVjdC1lcnJvciBcImRlZmluZVwiXG4gIGNvbnNvbGUudHJhY2UoJ3dpdGgtZGVmaW5lLW9iamVjdCcsIF9fdGVzdERlZmluZU9iamVjdClcbn1cblxubWFpbigpXG4iXSwibWFwcGluZ3MiOiJBQUVBLFNBQVMsR0FBTyxDQUNkLElBR0YsU0FBUyxHQUFZLENBRW5CLFFBQVEsTUFBTSxxQkFBQSxDQUFBLE1BQUEsU0FHaEIiLCJkZWJ1Z0lkIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIn0="
        }
      `)
  })

  test('correct sourcemap during ssr dev when using object as "define" value', async () => {
    const execFileAsync = promisify(execFile)
    await execFileAsync('node', ['test-ssr-dev.js'], {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
    })
  })

  test('source and sourcemap contain matching debug IDs', () => {
    function getDebugIdFromString(input: string): string | undefined {
      const match = input.match(/\/\/# debugId=([a-fA-F0-9-]+)/)
      return match ? match[1] : undefined
    }

    const assets = listAssets().map((asset) => `dist/assets/${asset}`)
    const jsAssets = assets.filter((asset) => asset.endsWith('.js'))

    for (const jsAsset of jsAssets) {
      const jsContent = readFile(jsAsset)
      const hasSourcemap = existsSync(`${jsAsset}.map`)
      if (!hasSourcemap) continue

      const sourceDebugId = getDebugIdFromString(jsContent)
      expect(
        sourceDebugId,
        `Asset '${jsAsset}' did not contain a debug ID`,
      ).toBeDefined()

      const mapFile = jsAsset + '.map'
      const mapContent = readFile(mapFile)

      const mapObj = JSON.parse(mapContent)
      const mapDebugId = mapObj.debugId

      expect(
        sourceDebugId,
        'Debug ID in source didnt match debug ID in sourcemap',
      ).toEqual(mapDebugId)
    }
  })
})
