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
        visualization: "https://evanw.github.io/source-map-visualization/#MjkyAGV4cG9ydCBjb25zdCBmb28gPSAnZm9vJwoKLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYkltWnZieTVxY3lKZExDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNld5SmxlSEJ2Y25RZ1kyOXVjM1FnWm05dklEMGdKMlp2YnlkY2JpSmRMQ0p1WVcxbGN5STZXMTBzSW0xaGNIQnBibWR6SWpvaVFVRkJRU3hOUVVGTkxFTkJRVU1zUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSE95SjkxNTEAeyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZvby5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgZm9vID0gJ2ZvbydcbiJdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRzsifQ=="
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
        visualization: "https://evanw.github.io/source-map-visualization/#Mzk0AGV4cG9ydCBjb25zdCB6b28gPSAnem9vJwovLyBhZGQgY29tbWVudAovLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW5wdmJ5NXFjeUpkTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lKbGVIQnZjblFnWTI5dWMzUWdlbTl2SUQwZ0ozcHZieWRjYmlKZExDSnVZVzFsY3lJNlcxMHNJbTFoY0hCcGJtZHpJam9pUVVGQlFTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN0luMD0yMTYAeyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInpvby5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3Qgem9vID0gJ3pvbydcbiJdLCJtYXBwaW5ncyI6IkFBQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOyJ9"
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
        visualization: "https://evanw.github.io/source-map-visualization/#MjY3AGV4cG9ydCBjb25zdCBmb28gPSAnZm9vJwovLyBkZWZhdWx0IGJvdW5kYXJ5IHNvdXJjZW1hcCB3aXRoIG1hZ2ljLXN0cmluZwovLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSWlKZExDSnVZVzFsY3lJNlcxMHNJbTFoY0hCcGJtZHpJam9pUVVGQlFTeE5RVUZOTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZISW4wPTk2AHsidmVyc2lvbiI6Mywic291cmNlcyI6WyIiXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcifQ=="
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
          "mappings": "AAAO,aAAM,MAAM;",
          "sources": [
            "bar.ts",
          ],
          "sourcesContent": [
            "export const bar = 'bar'
      ",
          ],
          "version": 3,
        },
        visualization: "https://evanw.github.io/source-map-visualization/#MjQxAGV4cG9ydCBjb25zdCBiYXIgPSAiYmFyIjsKCi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJbUpoY2k1MGN5SmRMQ0p6YjNWeVkyVnpRMjl1ZEdWdWRDSTZXeUpsZUhCdmNuUWdZMjl1YzNRZ1ltRnlJRDBnSjJKaGNpZGNiaUpkTENKdFlYQndhVzVuY3lJNklrRkJRVThzWVVGQlRTeE5RVUZOT3lJc0ltNWhiV1Z6SWpwYlhYMD0xMTEAeyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJhci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgYmFyID0gJ2JhcidcbiJdLCJtYXBwaW5ncyI6IkFBQU8sYUFBTSxNQUFNOyJ9"
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
        },
        visualization: "https://evanw.github.io/source-map-visualization/#NjQyAGltcG9ydCBfX3ZpdGVfX2Nqc0ltcG9ydDBfX3ZpdGVqc190ZXN0SW1wb3J0ZWVQa2cgZnJvbSAiL25vZGVfbW9kdWxlcy8udml0ZS9kZXBzL0B2aXRlanNfdGVzdC1pbXBvcnRlZS1wa2cuanM/dj0wMDAwMDAwMCI7IGNvbnN0IGZvbyA9IF9fdml0ZV9fY2pzSW1wb3J0MF9fdml0ZWpzX3Rlc3RJbXBvcnRlZVBrZ1siZm9vIl0KCjsKY29uc29sZS5sb2coIndpdGgtbXVsdGlsaW5lLWltcG9ydCIsIGZvbyk7CgovLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW5kcGRHZ3RiWFZzZEdsc2FXNWxMV2x0Y0c5eWRDNTBjeUpkTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lJdkx5QndjbVYwZEdsbGNpMXBaMjV2Y21WY2JtbHRjRzl5ZENCN1hHNGdJR1p2YjF4dWZTQm1jbTl0SUNkQWRtbDBaV3B6TDNSbGMzUXRhVzF3YjNKMFpXVXRjR3RuSjF4dVhHNWpiMjV6YjJ4bExteHZaeWduZDJsMGFDMXRkV3gwYVd4cGJtVXRhVzF3YjNKMEp5d2dabTl2S1Z4dUlsMHNJbTFoY0hCcGJtZHpJam9pUVVGRFFUdEJRVUZCTEVWQlEwVTdRVUZCUVN4UFFVTkxPMEZCUlZBc1VVRkJVU3hKUVVGSkxIbENRVUY1UWl4SFFVRkhPeUlzSW01aGJXVnpJanBiWFgwPTI1OAB7InZlcnNpb24iOjMsInNvdXJjZXMiOlsid2l0aC1tdWx0aWxpbmUtaW1wb3J0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIHByZXR0aWVyLWlnbm9yZVxuaW1wb3J0IHtcbiAgZm9vXG59IGZyb20gJ0B2aXRlanMvdGVzdC1pbXBvcnRlZS1wa2cnXG5cbmNvbnNvbGUubG9nKCd3aXRoLW11bHRpbGluZS1pbXBvcnQnLCBmb28pXG4iXSwibWFwcGluZ3MiOiJBQUNBO0FBQUEsRUFDRTtBQUFBLE9BQ0s7QUFFUCxRQUFRLElBQUkseUJBQXlCLEdBQUc7In0="
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
    expect(formatSourcemapForSnapshot(JSON.parse(map), js))
      .toMatchInlineSnapshot(`
        SourceMap {
          content: {
            "debugId": "00000000-0000-0000-0000-000000000000",
            "ignoreList": [],
            "mappings": ";4kCAAA,OAAO,2BAAuB,0BAE9B,QAAQ,IAAI,uBAAuB",
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
          visualization: "https://evanw.github.io/source-map-visualization/#MTQ2NgBjb25zdCBfX3ZpdGVfX21hcERlcHM9KGksbT1fX3ZpdGVfX21hcERlcHMsZD0obS5mfHwobS5mPVsiYXNzZXRzL2R5bmFtaWMtZm9vLUZfYXJUX3E1LmpzIiwiYXNzZXRzL2R5bmFtaWMtZm9vLURzcUtSckV5LmNzcyJdKSkpPT5pLm1hcChpPT5kW2ldKTsKY29uc3QgcD0ibW9kdWxlcHJlbG9hZCIsdj1mdW5jdGlvbihsKXtyZXR1cm4iLyIrbH0sdT17fSxFPWZ1bmN0aW9uKGQsYyx5KXtsZXQgaT1Qcm9taXNlLnJlc29sdmUoKTtpZihjJiZjLmxlbmd0aD4wKXtsZXQgZj1mdW5jdGlvbihlKXtyZXR1cm4gUHJvbWlzZS5hbGwoZS5tYXAobz0+UHJvbWlzZS5yZXNvbHZlKG8pLnRoZW4ocz0+KHtzdGF0dXM6ImZ1bGZpbGxlZCIsdmFsdWU6c30pLHM9Pih7c3RhdHVzOiJyZWplY3RlZCIscmVhc29uOnN9KSkpKX07ZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoImxpbmsiKTtjb25zdCBuPWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoIm1ldGFbcHJvcGVydHk9Y3NwLW5vbmNlXSIpLHQ9bj8ubm9uY2V8fG4/LmdldEF0dHJpYnV0ZSgibm9uY2UiKTtpPWYoYy5tYXAoZT0+e2lmKGU9dihlKSxlIGluIHUpcmV0dXJuO3VbZV09ITA7Y29uc3Qgbz1lLmVuZHNXaXRoKCIuY3NzIikscz1vPydbcmVsPSJzdHlsZXNoZWV0Il0nOiIiO2lmKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYGxpbmtbaHJlZj0iJHtlfSJdJHtzfWApKXJldHVybjtjb25zdCByPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoImxpbmsiKTtpZihyLnJlbD1vPyJzdHlsZXNoZWV0IjpwLG98fChyLmFzPSJzY3JpcHQiKSxyLmNyb3NzT3JpZ2luPSIiLHIuaHJlZj1lLHQmJnIuc2V0QXR0cmlidXRlKCJub25jZSIsdCksZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChyKSxvKXJldHVybiBuZXcgUHJvbWlzZSgobSxoKT0+e3IuYWRkRXZlbnRMaXN0ZW5lcigibG9hZCIsbSksci5hZGRFdmVudExpc3RlbmVyKCJlcnJvciIsKCk9PmgobmV3IEVycm9yKGBVbmFibGUgdG8gcHJlbG9hZCBDU1MgZm9yICR7ZX1gKSkpfSl9KSl9ZnVuY3Rpb24gYShuKXtjb25zdCB0PW5ldyBFdmVudCgidml0ZTpwcmVsb2FkRXJyb3IiLHtjYW5jZWxhYmxlOiEwfSk7aWYodC5wYXlsb2FkPW4sd2luZG93LmRpc3BhdGNoRXZlbnQodCksIXQuZGVmYXVsdFByZXZlbnRlZCl0aHJvdyBufXJldHVybiBpLnRoZW4obj0+e2Zvcihjb25zdCB0IG9mIG58fFtdKXQuc3RhdHVzPT09InJlamVjdGVkIiYmYSh0LnJlYXNvbik7cmV0dXJuIGQoKS5jYXRjaChhKX0pfTtFKCgpPT5pbXBvcnQoIi4vZHluYW1pYy1mb28tRl9hclRfcTUuanMiKSxfX3ZpdGVfX21hcERlcHMoWzAsMV0pKTtjb25zb2xlLmxvZygiYWZ0ZXIgcHJlbG9hZCBkeW5hbWljIik7ZXhwb3J0e0UgYXMgX307Ci8vIyBkZWJ1Z0lkPThjNDM0NWFiLWYxMzAtNGZmMi05NWRlLTA3NWI2ZTBhOGZjNgovLyMgc291cmNlTWFwcGluZ1VSTD1hZnRlci1wcmVsb2FkLWR5bmFtaWMtQ3E4cGpBT0wuanMubWFwCjI3NQB7InZlcnNpb24iOjMsIm1hcHBpbmdzIjoiOzRrQ0FBQSxPQUFPLDJCQUF1QiwwQkFFOUIsUUFBUSxJQUFJLHVCQUF1QiIsImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIi4uLy4uL2FmdGVyLXByZWxvYWQtZHluYW1pYy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQoJy4vZHluYW1pYy9keW5hbWljLWZvbycpXG5cbmNvbnNvbGUubG9nKCdhZnRlciBwcmVsb2FkIGR5bmFtaWMnKVxuIl0sImRlYnVnSWQiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDAifQ=="
        }
      `)
    // verify sourcemap comment is preserved at the last line
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
    const js = findAssetFile(/with-define-object.*\.js$/)
    const map = findAssetFile(/with-define-object.*\.js\.map/)
    expect(formatSourcemapForSnapshot(JSON.parse(map), js))
      .toMatchInlineSnapshot(`
        SourceMap {
          content: {
            "debugId": "00000000-0000-0000-0000-000000000000",
            "mappings": "qBAEA,SAASA,GAAO,CACJC,EAAA,CACZ,CAEA,SAASA,GAAY,CAEX,QAAA,MAAM,qBAAsBC,CAAkB,CACxD,CAEAF,EAAK",
            "names": [
              "main",
              "mainInner",
              "define_testDefineObject_default",
            ],
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
          visualization: "https://evanw.github.io/source-map-visualization/#MTk5AHZhciBlPXtoZWxsbzoidGVzdCJ9O2Z1bmN0aW9uIG4oKXt0KCl9ZnVuY3Rpb24gdCgpe2NvbnNvbGUudHJhY2UoIndpdGgtZGVmaW5lLW9iamVjdCIsZSl9bigpOwovLyMgZGVidWdJZD1iZDM5NjJmYy1lZGI1LTRhNmQtYTVkYS1mMjdhMWU1ZjMyNjgKLy8jIHNvdXJjZU1hcHBpbmdVUkw9d2l0aC1kZWZpbmUtb2JqZWN0LWhBU2RrZG55LmpzLm1hcAo1NjQAeyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3dpdGgtZGVmaW5lLW9iamVjdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0ZXN0IGNvbXBsaWNhdGVkIHN0YWNrIHNpbmNlIGJyb2tlbiBzb3VyY2VtYXBcbi8vIG1pZ2h0IHN0aWxsIGxvb2sgY29ycmVjdCB3aXRoIGEgc2ltcGxlIGNhc2VcbmZ1bmN0aW9uIG1haW4oKSB7XG4gIG1haW5Jbm5lcigpXG59XG5cbmZ1bmN0aW9uIG1haW5Jbm5lcigpIHtcbiAgLy8gQHRzLWV4cGVjdC1lcnJvciBcImRlZmluZVwiXG4gIGNvbnNvbGUudHJhY2UoJ3dpdGgtZGVmaW5lLW9iamVjdCcsIF9fdGVzdERlZmluZU9iamVjdClcbn1cblxubWFpbigpXG4iXSwibmFtZXMiOlsibWFpbiIsIm1haW5Jbm5lciIsImRlZmluZV90ZXN0RGVmaW5lT2JqZWN0X2RlZmF1bHQiXSwibWFwcGluZ3MiOiJxQkFFQSxTQUFTQSxHQUFPLENBQ0pDLEVBQUEsQ0FDWixDQUVBLFNBQVNBLEdBQVksQ0FFWCxRQUFBLE1BQU0scUJBQXNCQyxDQUFrQixDQUN4RCxDQUVBRixFQUFLIiwiZGVidWdJZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCJ9"
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
