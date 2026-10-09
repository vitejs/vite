import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { URL, fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping'
import { mapFileCommentRegex } from 'convert-source-map'
import { describe, expect, test, vi } from 'vitest'
import {
  extractSourcemap,
  findAssetFile,
  formatSourcemapForSnapshot,
  isBuild,
  isBundledDev,
  listAssets,
  page,
  readFile,
  serverLogs,
} from '~utils'
import { commentSourceMap } from '../foo-with-sourcemap-plugin'

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

async function getServedEntryChunk() {
  const srcMatches = await vi.waitFor(
    async () => {
      const html = await (await page.request.get(page.url())).text()
      const matches = [...html.matchAll(/<script[^>]* src="([^"]+)"/g)]
        // the server also injects its client runtime as a script tag (vitejs/vite#23161)
        .filter(([, src]) => !src.endsWith('/bundledDevClient.mjs'))
      expect(matches.length).toBeGreaterThan(0)
      return matches
    },
    { timeout: 10_000 },
  )
  // every bundled-dev check reads the map of this one chunk. Fail here and now
  // if the dev bundle ever starts splitting the entry into more chunks.
  expect(srcMatches).toHaveLength(1)
  const entryUrl = new URL(srcMatches[0][1], page.url())
  const js = await (await page.request.get(entryUrl.href)).text()
  const mapUrlMatch = js.match(/^\/\/# sourceMappingURL=(\S+)$/m)
  expect(mapUrlMatch).toBeTruthy()
  const mapRes = await page.request.get(new URL(mapUrlMatch![1], entryUrl).href)
  expect(mapRes.status()).toBe(200)
  return { js, map: await mapRes.json() }
}

function expectMapHasSource(map: any, fileName: string, content: string) {
  const index = map.sources.findIndex(
    (source: string) => source === fileName || source.endsWith(`/${fileName}`),
  )
  expect(
    index,
    `map.sources should contain ${fileName}`,
  ).toBeGreaterThanOrEqual(0)
  expect(map.sourcesContent[index]).toBe(content)
}

// check the mapping of a variable
function expectVarInitMapsBackToExportConst(
  js: string,
  map: any,
  name: string,
  fileName: string,
) {
  const lines = js.split('\n')
  const varRE = new RegExp(
    `^var ${escapeRegex(name)}\\S* = "${escapeRegex(name)}"`,
  )
  const lineIndex = lines.findIndex((line) => varRE.test(line))
  expect(lineIndex).toBeGreaterThanOrEqual(0)
  const position = originalPositionFor(new TraceMap(map), {
    line: lineIndex + 1,
    column: 'var '.length,
  })
  expect(position.source).toMatch(new RegExp(`(^|/)${escapeRegex(fileName)}$`))
  expect(position.line).toBe(1)
  expect(position.column).toBe(13)
}

if (!isBuild) {
  test('js', async () => {
    if (isBundledDev) {
      const { js, map } = await getServedEntryChunk()
      expectMapHasSource(map, 'foo.js', readFile('foo.js'))
      expectVarInitMapsBackToExportConst(js, map, 'foo', 'foo.js')
      return
    }
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
        visualization: "https://evanw.github.io/source-map-visualization/#MjUAZXhwb3J0IGNvbnN0IGZvbyA9ICdmb28nCjE1MQB7Im1hcHBpbmdzIjoiQUFBQSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHOyIsInNvdXJjZXMiOlsiZm9vLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBmb28gPSAnZm9vJ1xuIl0sInZlcnNpb24iOjN9"
      }
    `)
  })

  // bundled dev does not inject fallback sourcemap, so this test is irrelevant
  test.skipIf(isBundledDev)(
    'js with inline sourcemap injected by a plugin',
    async () => {
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
          visualization: "https://evanw.github.io/source-map-visualization/#NzMAZXhwb3J0IGNvbnN0IGZvbyA9ICdmb28nCi8vIGRlZmF1bHQgYm91bmRhcnkgc291cmNlbWFwIHdpdGggbWFnaWMtc3RyaW5nCjk2AHsibWFwcGluZ3MiOiJBQUFBLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUciLCJzb3VyY2VzIjpbIiJdLCJ2ZXJzaW9uIjozfQ=="
        }
      `)
    },
  )

  test('ts', async () => {
    if (isBundledDev) {
      const { js, map } = await getServedEntryChunk()
      expectMapHasSource(map, 'bar.ts', readFile('bar.ts'))
      expectVarInitMapsBackToExportConst(js, map, 'bar', 'bar.ts')
      return
    }
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

  // This test is for the import-analysis plugin (#14232), which does not run
  // in bundled dev.
  test.skipIf(isBundledDev)('multiline import', async () => {
    const res = await page.request.get(
      new URL('./with-multiline-import.ts', page.url()).href,
    )
    const js = await res.text()
    const map = extractSourcemap(js)
    expect(formatSourcemapForSnapshot(map, js)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "mappings": ";AACA,SACE,WACK;AAEP,QAAQ,IAAI,yBAAyB,GAAG",
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
        visualization: "https://evanw.github.io/source-map-visualization/#MjQ3AGNvbnN0IGZvbyA9IF9fdml0ZV9fY2pzSW1wb3J0MF9fdml0ZWpzX3Rlc3RJbXBvcnRlZVBrZ1siZm9vIl07Ly8gcHJldHRpZXItaWdub3JlCmltcG9ydCBfX3ZpdGVfX2Nqc0ltcG9ydDBfX3ZpdGVqc190ZXN0SW1wb3J0ZWVQa2cgZnJvbSAiL25vZGVfbW9kdWxlcy8udml0ZS9kZXBzL0B2aXRlanNfdGVzdC1pbXBvcnRlZS1wa2cuanM/dj0wMDAwMDAwMCI7CmNvbnNvbGUubG9nKCJ3aXRoLW11bHRpbGluZS1pbXBvcnQiLCBmb28pOwoyNDgAeyJtYXBwaW5ncyI6IjtBQUNBLFNBQ0UsV0FDSztBQUVQLFFBQVEsSUFBSSx5QkFBeUIsR0FBRyIsInNvdXJjZXMiOlsid2l0aC1tdWx0aWxpbmUtaW1wb3J0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIHByZXR0aWVyLWlnbm9yZVxuaW1wb3J0IHtcbiAgZm9vXG59IGZyb20gJ0B2aXRlanMvdGVzdC1pbXBvcnRlZS1wa2cnXG5cbmNvbnNvbGUubG9nKCd3aXRoLW11bHRpbGluZS1pbXBvcnQnLCBmb28pXG4iXSwidmVyc2lvbiI6M30="
      }
    `)
  })

  test('should not output missing source file warning', () => {
    serverLogs.forEach((log) => {
      expect(log).not.toMatch(/Sourcemap for .+ points to missing source files/)
    })
  })

  test('should not leak file contents via sourcemap path traversal in node_modules', async () => {
    if (isBundledDev) {
      // bundled-dev does not parse input sourcemaps,
      // it copies them as the input source as a whole into `sourcesContent`,
      // whereas unbundled-dev extracts the input sourcemaps
      const { map } = await getServedEntryChunk()
      expect(map.sources).toContainEqual(
        expect.stringContaining('test-dep-malicious-sourcemap'),
      )
      expect(map.sources).toContainEqual(
        expect.stringContaining('test-dep-optimized-malicious'),
      )
      expect(map.sourcesContent).toBeDefined()
      expect(map.sourcesContent).not.toContainEqual(
        expect.stringContaining('defineConfig'),
      )
      return
    }
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

  // bundled dev has no dep optimizer by design, so `/node_modules/.vite/deps/`
  // does not exist. The dep is still bundled, and the test above scans the
  // whole map, so the no-leak check still covers it.
  test.skipIf(isBundledDev)(
    'should not leak file contents via sourcemap path traversal in optimized deps',
    async () => {
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
      expect(depJs).toMatch(
        /^\/\/# sourceMappingURL=data:application\/json;base64,/m,
      )
      const map = extractSourcemap(depJs)
      expect(map.sourcesContent).toBeDefined()
      expect(map.sourcesContent).not.toContainEqual(
        expect.stringContaining('defineConfig'),
      )
    },
  )

  // bundled dev: these cases only apply with the dep optimizer. The test
  // plugins act on `/deps/` URLs, which do not exist under bundled dev.
  test.skipIf(isBundledDev)(
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

  test.skipIf(isBundledDev)(
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
            "mappings": ";skDAAAA,MAAA,OAAO,qDAEP,QAAQ,IAAI,uBAAuB",
            "names": [
              "__vitePreload",
            ],
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
          visualization: "https://evanw.github.io/source-map-visualization/#MTk3NwBjb25zdCBfX3ZpdGVfX21hcERlcHM9KGksbT1fX3ZpdGVfX21hcERlcHMsZD0obS5mfHwobS5mPVsiYXNzZXRzL2R5bmFtaWMtZm9vLUJ3aFpUa3RCLmpzIiwiYXNzZXRzL2R5bmFtaWMtZm9vLURzcUtSckV5LmNzcyJdKSkpPT5pLm1hcChpPT5kW2ldKTsKdmFyIGU9ZnVuY3Rpb24oZSl7cmV0dXJuYC9gK2V9LHQ9e30sbj17X19wcm90b19fOm51bGx9LHI9ZnVuY3Rpb24oZSl7cmV0dXJuIGUucGF0aG5hbWUuZW5kc1dpdGgoYC5jc3NgKX0saT1mdW5jdGlvbihlLHQsbil7aWYodCBpbiBlKXJldHVybiBlW3RdO2xldCByPW4oKTtpZighcil7ZVt0XT12b2lkIDA7cmV0dXJufWxldCBpPXIudGhlbigoKT0+e2VbdF09dm9pZCAwfSxuPT57dGhyb3cgZGVsZXRlIGVbdF0sbn0pO3JldHVybiBlW3RdPWksaX0sYT1mdW5jdGlvbihhLG8scyl7bGV0IGM9UHJvbWlzZS5yZXNvbHZlKCk7aWYobyYmby5sZW5ndGg+MCl7bGV0IGEsbD1kb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBtZXRhW3Byb3BlcnR5PWNzcC1ub25jZV1gKSx1PWw/Lm5vbmNlfHxsPy5nZXRBdHRyaWJ1dGUoYG5vbmNlYCk7ZnVuY3Rpb24gZChlKXtyZXR1cm4gUHJvbWlzZS5hbGwoZS5tYXAoZT0+UHJvbWlzZS5yZXNvbHZlKGUpLnRoZW4oZT0+KHtzdGF0dXM6YGZ1bGZpbGxlZGAsdmFsdWU6ZX0pLGU9Pih7c3RhdHVzOmByZWplY3RlZGAscmVhc29uOmV9KSkpKX1mdW5jdGlvbiBmKGUpe3JldHVybiBpbXBvcnQubWV0YS5yZXNvbHZlP25ldyBVUkwoaW1wb3J0Lm1ldGEucmVzb2x2ZShlKSk6bmV3IFVSTChlLGltcG9ydC5tZXRhLnVybCl9Yz1kKG8ubWFwKG89PntvPWUobyxzKTtsZXQgYz1mKG8pLGw9cihjKTtyZXR1cm4gaSh0LGMuaHJlZiwoKT0+e2lmKGE9PT12b2lkIDApe2E9e2FsbDpuZXcgU2V0LHN0eWxlczpuZXcgU2V0fTtsZXQgZT1kb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShgbGlua2ApO2ZvcihsZXQgdD1lLmxlbmd0aC0xO3Q+PTA7dC0tKXtsZXQgbj1lW3RdO2EuYWxsLmFkZChuLmhyZWYpLG4ucmVsPT09YHN0eWxlc2hlZXRgJiZhLnN0eWxlcy5hZGQobi5ocmVmKX19bGV0IGU9bD9hLnN0eWxlczphLmFsbCx0PWw/bltjLmhyZWZdOnZvaWQgMDtpZighdCYmZS5oYXMoYy5ocmVmKSlyZXR1cm47bGV0IHI9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChgbGlua2ApO2lmKHIucmVsPWw/YHN0eWxlc2hlZXRgOmBtb2R1bGVwcmVsb2FkYCxsfHwoci5hcz1gc2NyaXB0YCksci5jcm9zc09yaWdpbj1gYCxyLmhyZWY9Yy5ocmVmLHUmJnIuc2V0QXR0cmlidXRlKGBub25jZWAsdSksdD8oZGVsZXRlIG5bYy5ocmVmXSx0LnJlcGxhY2VXaXRoKHIpKTpkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHIpLGwpcmV0dXJuIG5ldyBQcm9taXNlKChlLHQpPT57ci5hZGRFdmVudExpc3RlbmVyKGBsb2FkYCxlKSxyLmFkZEV2ZW50TGlzdGVuZXIoYGVycm9yYCwoKT0+e25bYy5ocmVmXT1yLHQoRXJyb3IoYFVuYWJsZSB0byBwcmVsb2FkIENTUyBmb3IgJHtjfWApKX0pfSl9KX0pLmZpbHRlcihlPT5lIT09dm9pZCAwKSl9ZnVuY3Rpb24gbChlKXtsZXQgdD1uZXcgRXZlbnQoYHZpdGU6cHJlbG9hZEVycm9yYCx7Y2FuY2VsYWJsZTohMH0pO2lmKHQucGF5bG9hZD1lLHdpbmRvdy5kaXNwYXRjaEV2ZW50KHQpLCF0LmRlZmF1bHRQcmV2ZW50ZWQpdGhyb3cgZX1yZXR1cm4gYy50aGVuKGU9Pntmb3IobGV0IHQgb2YgZXx8W10pdC5zdGF0dXM9PT1gcmVqZWN0ZWRgJiZsKHQucmVhc29uKTtyZXR1cm4gYSgpLmNhdGNoKGwpfSl9O2EoKCk9PmltcG9ydChgLi9keW5hbWljLWZvby1Cd2haVGt0Qi5qc2ApLF9fdml0ZV9fbWFwRGVwcyhbMCwxXSkpLGNvbnNvbGUubG9nKGBhZnRlciBwcmVsb2FkIGR5bmFtaWNgKTtleHBvcnR7YSBhcyB0fTsKLy8jIGRlYnVnSWQ9YjZjNzFmYWQtZjMxZi00NjhlLTgzZmQtNWI3YWMwYjhjNTMxCi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFmdGVyLXByZWxvYWQtZHluYW1pYy1DMnh4LXQ4eC5qcy5tYXAyODMAeyJkZWJ1Z0lkIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIiwibWFwcGluZ3MiOiI7c2tEQUFBQSxNQUFBLE9BQU8scURBRVAsUUFBUSxJQUFJLHVCQUF1QiIsIm5hbWVzIjpbIl9fdml0ZVByZWxvYWQiXSwic291cmNlcyI6WyIuLi8uLi9hZnRlci1wcmVsb2FkLWR5bmFtaWMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0KCcuL2R5bmFtaWMvZHluYW1pYy1mb28nKVxuXG5jb25zb2xlLmxvZygnYWZ0ZXIgcHJlbG9hZCBkeW5hbWljJylcbiJdLCJ2ZXJzaW9uIjozfQ=="
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
            "mappings": "AAEA,SAASA,GAAO,CACdC,EAAU,CACZ,CAEA,SAASA,GAAY,CAEnB,QAAQ,MAAM,qBAAA,CAAAC,MAAA,MAAA,CAAwC,CACxD,CAEAF,EAAK",
            "names": [
              "main",
              "mainInner",
              ""hello"",
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
          visualization: "https://evanw.github.io/source-map-visualization/#MTkwAGZ1bmN0aW9uIGUoKXt0KCl9ZnVuY3Rpb24gdCgpe2NvbnNvbGUudHJhY2UoYHdpdGgtZGVmaW5lLW9iamVjdGAse2hlbGxvOmB0ZXN0YH0pfWUoKTsKLy8jIGRlYnVnSWQ9NjRlNzI1NTUtMTk0Zi00MTRkLTk1MzUtOWVmYjI1ZTQyZmI2Ci8vIyBzb3VyY2VNYXBwaW5nVVJMPXdpdGgtZGVmaW5lLW9iamVjdC1CazV5VlZHVS5qcy5tYXA1NTYAeyJkZWJ1Z0lkIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIiwibWFwcGluZ3MiOiJBQUVBLFNBQVNBLEdBQU8sQ0FDZEMsRUFBVSxDQUNaLENBRUEsU0FBU0EsR0FBWSxDQUVuQixRQUFRLE1BQU0scUJBQUEsQ0FBQUMsTUFBQSxNQUFBLENBQXdDLENBQ3hELENBRUFGLEVBQUsiLCJuYW1lcyI6WyJtYWluIiwibWFpbklubmVyIiwiXCJoZWxsb1wiIl0sInNvdXJjZXMiOlsiLi4vLi4vd2l0aC1kZWZpbmUtb2JqZWN0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIHRlc3QgY29tcGxpY2F0ZWQgc3RhY2sgc2luY2UgYnJva2VuIHNvdXJjZW1hcFxuLy8gbWlnaHQgc3RpbGwgbG9vayBjb3JyZWN0IHdpdGggYSBzaW1wbGUgY2FzZVxuZnVuY3Rpb24gbWFpbigpIHtcbiAgbWFpbklubmVyKClcbn1cblxuZnVuY3Rpb24gbWFpbklubmVyKCkge1xuICAvLyBAdHMtZXhwZWN0LWVycm9yIFwiZGVmaW5lXCJcbiAgY29uc29sZS50cmFjZSgnd2l0aC1kZWZpbmUtb2JqZWN0JywgX190ZXN0RGVmaW5lT2JqZWN0KVxufVxuXG5tYWluKClcbiJdLCJ2ZXJzaW9uIjozfQ=="
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
