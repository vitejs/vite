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
        visualization: "https://evanw.github.io/source-map-visualization/#MjYAZXhwb3J0IGNvbnN0IGJhciA9ICJiYXIiOwoxMTUAeyJtYXBwaW5ncyI6IkFBQUEsT0FBTyxNQUFNLE1BQU0iLCJzb3VyY2VzIjpbImJhci50cyJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgYmFyID0gJ2JhcidcbiJdfQ=="
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
          "mappings": ";AACA,SACE,WACK;AAEP,QAAQ,IAAI,yBAAyB,IAAI",
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
        visualization: "https://evanw.github.io/source-map-visualization/#MjQ4AC8vIHByZXR0aWVyLWlnbm9yZQppbXBvcnQgX192aXRlX19janNJbXBvcnQwX192aXRlanNfdGVzdEltcG9ydGVlUGtnIGZyb20gIi9ub2RlX21vZHVsZXMvLnZpdGUvZGVwcy9Adml0ZWpzX3Rlc3QtaW1wb3J0ZWUtcGtnLmpzP3Y9MDAwMDAwMDAiOyBjb25zdCBmb28gPSBfX3ZpdGVfX2Nqc0ltcG9ydDBfX3ZpdGVqc190ZXN0SW1wb3J0ZWVQa2dbImZvbyJdOwpjb25zb2xlLmxvZygid2l0aC1tdWx0aWxpbmUtaW1wb3J0IiwgZm9vKTsKMjQ4AHsibWFwcGluZ3MiOiI7QUFDQSxTQUNFLFdBQ0s7QUFFUCxRQUFRLElBQUkseUJBQXlCLElBQUkiLCJzb3VyY2VzIjpbIndpdGgtbXVsdGlsaW5lLWltcG9ydC50cyJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyIvLyBwcmV0dGllci1pZ25vcmVcbmltcG9ydCB7XG4gIGZvb1xufSBmcm9tICdAdml0ZWpzL3Rlc3QtaW1wb3J0ZWUtcGtnJ1xuXG5jb25zb2xlLmxvZygnd2l0aC1tdWx0aWxpbmUtaW1wb3J0JywgZm9vKVxuIl19"
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
            "mappings": ";yuCAAA,OAAO,qDAEP,QAAQ,IAAI,wBAAwB",
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
          visualization: "https://evanw.github.io/source-map-visualization/#MTYyMgBjb25zdCBfX3ZpdGVfX21hcERlcHM9KGksbT1fX3ZpdGVfX21hcERlcHMsZD0obS5mfHwobS5mPVsiYXNzZXRzL2R5bmFtaWMtZm9vLXRpUHBTUURiLmpzIiwiYXNzZXRzL2R5bmFtaWMtZm9vLURzcUtSckV5LmNzcyJdKSkpPT5pLm1hcChpPT5kW2ldKTsKdmFyIGU9YG1vZHVsZXByZWxvYWRgLHQ9ZnVuY3Rpb24oZSl7cmV0dXJuYC9gK2V9LG49e307Y29uc3Qgcj1mdW5jdGlvbihyLGksYSl7bGV0IG89UHJvbWlzZS5yZXNvbHZlKCk7aWYoaSYmaS5sZW5ndGg+MCl7bGV0IHI9ZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoYGxpbmtgKSxzPWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYG1ldGFbcHJvcGVydHk9Y3NwLW5vbmNlXWApLGM9cz8ubm9uY2V8fHM/LmdldEF0dHJpYnV0ZShgbm9uY2VgKTtmdW5jdGlvbiBsKGUpe3JldHVybiBQcm9taXNlLmFsbChlLm1hcChlPT5Qcm9taXNlLnJlc29sdmUoZSkudGhlbihlPT4oe3N0YXR1czpgZnVsZmlsbGVkYCx2YWx1ZTplfSksZT0+KHtzdGF0dXM6YHJlamVjdGVkYCxyZWFzb246ZX0pKSkpfWZ1bmN0aW9uIHUoZSl7cmV0dXJuIGltcG9ydC5tZXRhLnJlc29sdmU/aW1wb3J0Lm1ldGEucmVzb2x2ZShlKTpuZXcgVVJMKGUsbmV3IFVSTChgLi4vLi4vLi4vc3JjL25vZGUvcGx1Z2lucy9pbXBvcnRBbmFseXNpc0J1aWxkLnRzYCxpbXBvcnQubWV0YS51cmwpKS5ocmVmfW89bChpLm1hcChpPT57aWYoaT10KGksYSksaT11KGkpLGkgaW4gbilyZXR1cm47bltpXT0hMDtsZXQgbz1pLmVuZHNXaXRoKGAuY3NzYCk7Zm9yKGxldCBlPXIubGVuZ3RoLTE7ZT49MDtlLS0pe2xldCB0PXJbZV07aWYodC5ocmVmPT09aSYmKCFvfHx0LnJlbD09PWBzdHlsZXNoZWV0YCkpcmV0dXJufWxldCBzPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoYGxpbmtgKTtpZihzLnJlbD1vP2BzdHlsZXNoZWV0YDplLG98fChzLmFzPWBzY3JpcHRgKSxzLmNyb3NzT3JpZ2luPWBgLHMuaHJlZj1pLGMmJnMuc2V0QXR0cmlidXRlKGBub25jZWAsYyksZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzKSxvKXJldHVybiBuZXcgUHJvbWlzZSgoZSx0KT0+e3MuYWRkRXZlbnRMaXN0ZW5lcihgbG9hZGAsZSkscy5hZGRFdmVudExpc3RlbmVyKGBlcnJvcmAsKCk9PnQoRXJyb3IoYFVuYWJsZSB0byBwcmVsb2FkIENTUyBmb3IgJHtpfWApKSl9KX0pKX1mdW5jdGlvbiBzKGUpe2xldCB0PW5ldyBFdmVudChgdml0ZTpwcmVsb2FkRXJyb3JgLHtjYW5jZWxhYmxlOiEwfSk7aWYodC5wYXlsb2FkPWUsd2luZG93LmRpc3BhdGNoRXZlbnQodCksIXQuZGVmYXVsdFByZXZlbnRlZCl0aHJvdyBlfXJldHVybiBvLnRoZW4oZT0+e2ZvcihsZXQgdCBvZiBlfHxbXSl0LnN0YXR1cz09PWByZWplY3RlZGAmJnModC5yZWFzb24pO3JldHVybiByKCkuY2F0Y2gocyl9KX07cigoKT0+aW1wb3J0KGAuL2R5bmFtaWMtZm9vLXRpUHBTUURiLmpzYCksX192aXRlX19tYXBEZXBzKFswLDFdKSksY29uc29sZS5sb2coYGFmdGVyIHByZWxvYWQgZHluYW1pY2ApO2V4cG9ydHtyIGFzIHR9OwovLyMgZGVidWdJZD1iNTE1Nzk1MC1hMDFhLTQ1YjEtYmUwYi00ZWNkMzNlMjYzYjAKLy8jIHNvdXJjZU1hcHBpbmdVUkw9YWZ0ZXItcHJlbG9hZC1keW5hbWljLUMxRlhsUW9CLmpzLm1hcDI2NwB7InZlcnNpb24iOjMsIm1hcHBpbmdzIjoiO3l1Q0FBQSxPQUFPLHFEQUVQLFFBQVEsSUFBSSx3QkFBd0IiLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyIuLi8uLi9hZnRlci1wcmVsb2FkLWR5bmFtaWMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0KCcuL2R5bmFtaWMvZHluYW1pYy1mb28nKVxuXG5jb25zb2xlLmxvZygnYWZ0ZXIgcHJlbG9hZCBkeW5hbWljJylcbiJdLCJkZWJ1Z0lkIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIn0="
        }
      `)
    // verify sourcemap comment is preserved at the last line
    expect(js).toMatch(
      /\n\/\/# sourceMappingURL=after-preload-dynamic-[-\w]{8}\.js\.map\n?$/,
    )
  })

  test('sourcemap file field is consistent (#20853)', async () => {
    const assets = listAssets()
    const mapAssets = assets.filter((asset) => asset.endsWith('.js.map'))

    for (const mapAsset of mapAssets) {
      const mapContent = readFile(`dist/assets/${mapAsset}`)
      const mapObj = JSON.parse(mapContent)

      if (mapObj.file) {
        expect(
          mapObj.file,
          `Sourcemap file field for ${mapAsset} should be just the filename`,
        ).toMatch(/^[^/]+\.js$/)
      }
    }
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
            "mappings": "AAEA,SAAS,GAAO,CACd,GAAW,CAGb,SAAS,GAAY,CAEnB,QAAQ,MAAM,qBAAA,CAAA,MAAA,OAAA,CAAyC,CAGzD,GAAM",
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
          visualization: "https://evanw.github.io/source-map-visualization/#MTkwAGZ1bmN0aW9uIGUoKXt0KCl9ZnVuY3Rpb24gdCgpe2NvbnNvbGUudHJhY2UoYHdpdGgtZGVmaW5lLW9iamVjdGAse2hlbGxvOmB0ZXN0YH0pfWUoKTsKLy8jIGRlYnVnSWQ9NTBlZDE3M2ItOTIxYS00ZjMyLTk0MTAtMzBlZjc3ZmVlMGI5Ci8vIyBzb3VyY2VNYXBwaW5nVVJMPXdpdGgtZGVmaW5lLW9iamVjdC1CUTdSYzdraC5qcy5tYXA1MDAAeyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3dpdGgtZGVmaW5lLW9iamVjdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0ZXN0IGNvbXBsaWNhdGVkIHN0YWNrIHNpbmNlIGJyb2tlbiBzb3VyY2VtYXBcbi8vIG1pZ2h0IHN0aWxsIGxvb2sgY29ycmVjdCB3aXRoIGEgc2ltcGxlIGNhc2VcbmZ1bmN0aW9uIG1haW4oKSB7XG4gIG1haW5Jbm5lcigpXG59XG5cbmZ1bmN0aW9uIG1haW5Jbm5lcigpIHtcbiAgLy8gQHRzLWV4cGVjdC1lcnJvciBcImRlZmluZVwiXG4gIGNvbnNvbGUudHJhY2UoJ3dpdGgtZGVmaW5lLW9iamVjdCcsIF9fdGVzdERlZmluZU9iamVjdClcbn1cblxubWFpbigpXG4iXSwibWFwcGluZ3MiOiJBQUVBLFNBQVMsR0FBTyxDQUNkLEdBQVcsQ0FHYixTQUFTLEdBQVksQ0FFbkIsUUFBUSxNQUFNLHFCQUFBLENBQUEsTUFBQSxPQUFBLENBQXlDLENBR3pELEdBQU0iLCJkZWJ1Z0lkIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIn0="
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
