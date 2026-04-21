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

function createMapFileReader(moduleUrl: string) {
  return async (filename: string): Promise<string> => {
    const base = new URL(moduleUrl, page.url())
    const res = await page.request.get(new URL(filename, base).href)
    return res.text()
  }
}

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
        visualization: "https://evanw.github.io/source-map-visualization/#MjQ3AGNvbnN0IGZvbyA9IF9fdml0ZV9fY2pzSW1wb3J0MF9fdml0ZWpzX3Rlc3RJbXBvcnRlZVBrZ1siZm9vIl07Ly8gcHJldHRpZXItaWdub3JlCmltcG9ydCBfX3ZpdGVfX2Nqc0ltcG9ydDBfX3ZpdGVqc190ZXN0SW1wb3J0ZWVQa2cgZnJvbSAiL25vZGVfbW9kdWxlcy8udml0ZS9kZXBzL0B2aXRlanNfdGVzdC1pbXBvcnRlZS1wa2cuanM/dj0wMDAwMDAwMCI7CmNvbnNvbGUubG9nKCJ3aXRoLW11bHRpbGluZS1pbXBvcnQiLCBmb28pOwoyNDgAeyJtYXBwaW5ncyI6IjtBQUNBLFNBQ0UsV0FDSztBQUVQLFFBQVEsSUFBSSx5QkFBeUIsSUFBSSIsInNvdXJjZXMiOlsid2l0aC1tdWx0aWxpbmUtaW1wb3J0LnRzIl0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbIi8vIHByZXR0aWVyLWlnbm9yZVxuaW1wb3J0IHtcbiAgZm9vXG59IGZyb20gJ0B2aXRlanMvdGVzdC1pbXBvcnRlZS1wa2cnXG5cbmNvbnNvbGUubG9nKCd3aXRoLW11bHRpbGluZS1pbXBvcnQnLCBmb28pXG4iXX0="
      }
    `)
  })

  test('should not output missing source file warning', () => {
    serverLogs.forEach((log) => {
      expect(log).not.toMatch(/Sourcemap for .+ points to missing source files/)
    })
  })

  test('should not leak file contents via sourcemap path traversal in node_modules', async () => {
    const res = await page.request.get(
      new URL('./malicious-import.js', page.url()).href,
    )
    const js = await res.text()
    // Find the rewritten import URL for the malicious dep
    const depUrlMatch = js.match(/from\s+"([^"]*malicious-sourcemap[^"]*)"/)
    expect(depUrlMatch).toBeTruthy()
    const depUrl = depUrlMatch![1]
    const depRes = await page.request.get(new URL(depUrl, page.url()).href)
    const depJs = await depRes.text()
    const map = extractSourcemap(depJs)
    expect(map.sourcesContent).toBeDefined()
    expect(map.sourcesContent).not.toContainEqual(
      expect.stringContaining('defineConfig'),
    )
  })

  test('should not leak file contents via sourcemap path traversal in optimized deps', async () => {
    const res = await page.request.get(
      new URL('./optimized-malicious-import.js', page.url()).href,
    )
    const js = await res.text()
    // Find the rewritten import URL for the optimized malicious dep
    const depUrlMatch = js.match(/from\s+"([^"]*optimized-malicious[^"]*)"/)
    expect(depUrlMatch).toBeTruthy()
    const depUrl = depUrlMatch![1]
    // Ensure the dep was actually optimized (served from .vite/deps)
    expect(depUrl).toContain('.vite/deps')
    const depRes = await page.request.get(new URL(depUrl, page.url()).href)
    const depJs = await depRes.text()
    const map = await extractSourcemap(depJs, createMapFileReader(depUrl))
    expect(map.sourcesContent).toBeDefined()
    expect(map.sourcesContent).not.toContainEqual(
      expect.stringContaining('defineConfig'),
    )
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
            "mappings": ";myCAAA,OAAO,qDAEP,QAAQ,IAAI,wBAAwB",
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
          visualization: "https://evanw.github.io/source-map-visualization/#MTY4MABjb25zdCBfX3ZpdGVfX21hcERlcHM9KGksbT1fX3ZpdGVfX21hcERlcHMsZD0obS5mfHwobS5mPVsiYXNzZXRzL2R5bmFtaWMtZm9vLUI0SmtWTWJvLmpzIiwiYXNzZXRzL2R5bmFtaWMtZm9vLURzcUtSckV5LmNzcyJdKSkpPT5pLm1hcChpPT5kW2ldKTsKdmFyIGU9YG1vZHVsZXByZWxvYWRgLHQ9ZnVuY3Rpb24oZSl7cmV0dXJuYC9gK2V9LG49e30scj1mdW5jdGlvbihyLGksYSl7bGV0IG89UHJvbWlzZS5yZXNvbHZlKCk7aWYoaSYmaS5sZW5ndGg+MCl7bGV0IHI9ZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoYGxpbmtgKSxzPWU9PntsZXQgdD1kb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBtZXRhW3Byb3BlcnR5PSIke2V9Il1gKTtpZih0Py5oYXNBdHRyaWJ1dGUoYG5vbmNlYCkpcmV0dXJuIHQ/Lm5vbmNlfHx0Py5nZXRBdHRyaWJ1dGUoYG5vbmNlYCl8fHZvaWQgMH0sYz1zKGBjc3Atbm9uY2VgKSxsPXMoYGNzcC1zY3JpcHQtbm9uY2VgKXx8Yyx1PXMoYGNzcC1zdHlsZS1ub25jZWApfHxjO2Z1bmN0aW9uIGQoZSl7cmV0dXJuIFByb21pc2UuYWxsKGUubWFwKGU9PlByb21pc2UucmVzb2x2ZShlKS50aGVuKGU9Pih7c3RhdHVzOmBmdWxmaWxsZWRgLHZhbHVlOmV9KSxlPT4oe3N0YXR1czpgcmVqZWN0ZWRgLHJlYXNvbjplfSkpKSl9bz1kKGkubWFwKGk9PntpZihpPXQoaSxhKSxpIGluIG4pcmV0dXJuO25baV09ITA7bGV0IG89aS5lbmRzV2l0aChgLmNzc2ApLHM9bz9gW3JlbD0ic3R5bGVzaGVldCJdYDpgYDtpZihhKWZvcihsZXQgZT1yLmxlbmd0aC0xO2U+PTA7ZS0tKXtsZXQgdD1yW2VdO2lmKHQuaHJlZj09PWkmJighb3x8dC5yZWw9PT1gc3R5bGVzaGVldGApKXJldHVybn1lbHNlIGlmKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYGxpbmtbaHJlZj0iJHtpfSJdJHtzfWApKXJldHVybjtsZXQgYz1kb2N1bWVudC5jcmVhdGVFbGVtZW50KGBsaW5rYCk7Yy5yZWw9bz9gc3R5bGVzaGVldGA6ZSxvfHwoYy5hcz1gc2NyaXB0YCksYy5jcm9zc09yaWdpbj1gYCxjLmhyZWY9aTtsZXQgZD1vP3U6bDtpZihkJiZjLnNldEF0dHJpYnV0ZShgbm9uY2VgLGQpLGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoYyksbylyZXR1cm4gbmV3IFByb21pc2UoKGUsdCk9PntjLmFkZEV2ZW50TGlzdGVuZXIoYGxvYWRgLGUpLGMuYWRkRXZlbnRMaXN0ZW5lcihgZXJyb3JgLCgpPT50KEVycm9yKGBVbmFibGUgdG8gcHJlbG9hZCBDU1MgZm9yICR7aX1gKSkpfSl9KSl9ZnVuY3Rpb24gcyhlKXtsZXQgdD1uZXcgRXZlbnQoYHZpdGU6cHJlbG9hZEVycm9yYCx7Y2FuY2VsYWJsZTohMH0pO2lmKHQucGF5bG9hZD1lLHdpbmRvdy5kaXNwYXRjaEV2ZW50KHQpLCF0LmRlZmF1bHRQcmV2ZW50ZWQpdGhyb3cgZX1yZXR1cm4gby50aGVuKGU9Pntmb3IobGV0IHQgb2YgZXx8W10pdC5zdGF0dXM9PT1gcmVqZWN0ZWRgJiZzKHQucmVhc29uKTtyZXR1cm4gcigpLmNhdGNoKHMpfSl9O3IoKCk9PmltcG9ydChgLi9keW5hbWljLWZvby1CNEprVk1iby5qc2ApLF9fdml0ZV9fbWFwRGVwcyhbMCwxXSkpLGNvbnNvbGUubG9nKGBhZnRlciBwcmVsb2FkIGR5bmFtaWNgKTtleHBvcnR7ciBhcyB0fTsKLy8jIGRlYnVnSWQ9NjFlYWVhOTQtMmM0NS00NGM5LTkxYTUtMjExZTZjMDE3YTc3Ci8vIyBzb3VyY2VNYXBwaW5nVVJMPWFmdGVyLXByZWxvYWQtZHluYW1pYy1CaDZ1cVVMRS5qcy5tYXAyNjcAeyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6IjtteUNBQUEsT0FBTyxxREFFUCxRQUFRLElBQUksd0JBQXdCIiwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiLi4vLi4vYWZ0ZXItcHJlbG9hZC1keW5hbWljLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCgnLi9keW5hbWljL2R5bmFtaWMtZm9vJylcblxuY29uc29sZS5sb2coJ2FmdGVyIHByZWxvYWQgZHluYW1pYycpXG4iXSwiZGVidWdJZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCJ9"
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
          visualization: "https://evanw.github.io/source-map-visualization/#MTkwAGZ1bmN0aW9uIGUoKXt0KCl9ZnVuY3Rpb24gdCgpe2NvbnNvbGUudHJhY2UoYHdpdGgtZGVmaW5lLW9iamVjdGAse2hlbGxvOmB0ZXN0YH0pfWUoKTsKLy8jIGRlYnVnSWQ9ZmVmMjQxOWEtZmZmOC00MzMwLTgzZTktMWRkNTVlYmNmOTBkCi8vIyBzb3VyY2VNYXBwaW5nVVJMPXdpdGgtZGVmaW5lLW9iamVjdC1ELThrR2FfXy5qcy5tYXA1MDAAeyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3dpdGgtZGVmaW5lLW9iamVjdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0ZXN0IGNvbXBsaWNhdGVkIHN0YWNrIHNpbmNlIGJyb2tlbiBzb3VyY2VtYXBcbi8vIG1pZ2h0IHN0aWxsIGxvb2sgY29ycmVjdCB3aXRoIGEgc2ltcGxlIGNhc2VcbmZ1bmN0aW9uIG1haW4oKSB7XG4gIG1haW5Jbm5lcigpXG59XG5cbmZ1bmN0aW9uIG1haW5Jbm5lcigpIHtcbiAgLy8gQHRzLWV4cGVjdC1lcnJvciBcImRlZmluZVwiXG4gIGNvbnNvbGUudHJhY2UoJ3dpdGgtZGVmaW5lLW9iamVjdCcsIF9fdGVzdERlZmluZU9iamVjdClcbn1cblxubWFpbigpXG4iXSwibWFwcGluZ3MiOiJBQUVBLFNBQVMsR0FBTyxDQUNkLEdBQVcsQ0FHYixTQUFTLEdBQVksQ0FFbkIsUUFBUSxNQUFNLHFCQUFBLENBQUEsTUFBQSxPQUFBLENBQXlDLENBR3pELEdBQU0iLCJkZWJ1Z0lkIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIn0="
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
