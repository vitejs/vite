import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import {
  extractSourcemap,
  formatSourcemapForSnapshot,
  isBuild,
  isServe,
  page,
  readManifest,
  testDir,
  viteTestUrl,
} from '~utils'

test('normal', async () => {
  await expect.poll(() => page.textContent('.pong')).toMatch('pong')
  await expect
    .poll(() => page.textContent('.mode'))
    .toMatch(process.env.NODE_ENV)
  await expect
    .poll(() => page.textContent('.bundle-with-plugin'))
    .toMatch('worker bundle with plugin success!')
  await expect
    .poll(() => page.textContent('.asset-url'))
    .toMatch(
      isBuild
        ? /\/iife\/assets\/worker_asset-vite-[\w-]{8}\.svg/
        : '/iife/vite.svg',
    )
})

test('named', async () => {
  await expect
    .poll(() => page.textContent('.pong-named'))
    .toMatch('namedWorker')
})

test('TS output', async () => {
  await expect.poll(() => page.textContent('.pong-ts-output')).toMatch('pong')
})

test('inlined', async () => {
  await expect.poll(() => page.textContent('.pong-inline')).toMatch('pong')
})

test('named inlined', async () => {
  await expect
    .poll(() => page.textContent('.pong-inline-named'))
    .toMatch('namedInlineWorker')
})

test('shared worker', async () => {
  await expect.poll(() => page.textContent('.tick-count')).toMatch('pong')
})

test('named shared worker', async () => {
  await expect.poll(() => page.textContent('.tick-count-named')).toMatch('pong')
})

test('inline shared worker', async () => {
  await expect
    .poll(() => page.textContent('.pong-shared-inline'))
    .toMatch('pong')
})

test.runIf(!isBuild)(
  'worker emitted and import.meta.url in nested worker (serve)',
  async () => {
    await expect
      .poll(() => page.textContent('.nested-worker'))
      .toMatch('/worker-nested')
    await expect
      .poll(() => page.textContent('.nested-worker-module'))
      .toMatch('/sub-worker')
    await expect
      .poll(() => page.textContent('.nested-worker-constructor'))
      .toMatch('"type":"constructor"')
  },
)

describe.runIf(isBuild)('build', () => {
  // assert correct files
  test('inlined code generation', async () => {
    const assetsDir = path.resolve(testDir, 'dist/iife/assets')
    const files = fs.readdirSync(assetsDir)

    // inline-only worker should not be emitted as a separate worker file
    const workerFiles = files.filter((f) => f.startsWith('worker_'))
    for (const file of workerFiles) {
      const fileContent = fs.readFileSync(
        path.resolve(assetsDir, file),
        'utf-8',
      )
      expect(fileContent).not.toContain('my-inline-shared-worker.js')
    }

    const index = files.find((f) => f.includes('main-module'))
    const content = fs.readFileSync(path.resolve(assetsDir, index), 'utf-8')
    const worker = files.find((f) => f.includes('worker_entry-my-worker'))
    const workerContent = fs.readFileSync(
      path.resolve(assetsDir, worker),
      'utf-8',
    )

    // worker should have all imports resolved and no exports
    expect(workerContent).not.toMatch(/import\s*["(]/)
    expect(workerContent).not.toMatch(/\bexport\b/)
    // chunk
    expect(content).toMatch('new Worker(`/iife/assets')
    expect(content).toMatch('new SharedWorker(`/iife/assets')
    // inlined
    expect(content).toMatch(`(self.URL||self.webkitURL).createObjectURL`)
    expect(content).toMatch(`self.Blob`)
  })

  test('worker emitted and import.meta.url in nested worker (build)', async () => {
    await expect
      .poll(() => page.textContent('.nested-worker-module'))
      .toMatch('"type":"module"')
    await expect
      .poll(() => page.textContent('.nested-worker-constructor'))
      .toMatch('"type":"constructor"')
  })

  test('should not emit worker manifest', async () => {
    const manifest = readManifest('iife')
    expect(manifest['index.html']).toBeDefined()
  })
})

test('module worker', async () => {
  await expect
    .poll(async () => page.textContent('.worker-import-meta-url'))
    .toMatch(/A\sstring.*\/iife\/.+url-worker\.js.+url-worker\.js/)
  await expect
    .poll(() => page.textContent('.worker-import-meta-url-resolve'))
    .toMatch(/A\sstring.*\/iife\/.+url-worker\.js.+url-worker\.js/)
  await expect
    .poll(() => page.textContent('.worker-import-meta-url-without-extension'))
    .toMatch(/A\sstring.*\/iife\/.+url-worker\.js.+url-worker\.js/)
  await expect
    .poll(() => page.textContent('.shared-worker-import-meta-url'))
    .toMatch('A string')
})

test('classic worker', async () => {
  await expect
    .poll(() => page.textContent('.classic-worker'))
    .toMatch('A classic')
  if (!isBuild) {
    await expect
      .poll(() => page.textContent('.classic-worker-import'))
      .toMatch('[success] classic-esm')
  }
  await expect
    .poll(() => page.textContent('.classic-shared-worker'))
    .toMatch('A classic')
})

test('url query worker', async () => {
  await expect
    .poll(() => page.textContent('.simple-worker-url'))
    .toMatch('Hello from simple worker!')
})

test('import.meta.glob eager in worker', async () => {
  await expect
    .poll(() => page.textContent('.importMetaGlobEager-worker'))
    .toMatch('["')
})

test.runIf(isBuild)('require json in worker', async () => {
  await expect
    .poll(() => page.textContent('.worker-require-json'))
    .toMatch('[{"name":"a"},{"name":"b"}]')
})

test('self reference worker', async () => {
  await expect
    .poll(() => page.textContent('.self-reference-worker'))
    .toBe('pong: main\npong: nested\n')
})

test('self reference url worker', async () => {
  await expect
    .poll(() => page.textContent('.self-reference-url-worker'))
    .toBe('pong: main\npong: nested\n')
})

test('self reference url worker in dependency', async () => {
  await expect
    .poll(() => page.textContent('.self-reference-url-worker-dep'))
    .toBe('pong: main\npong: nested\n')
})

test.runIf(isServe)('sourcemap is correct after env is injected', async () => {
  const response = page.waitForResponse(
    /my-worker\.ts\?worker_file&type=module/,
  )
  await page.goto(viteTestUrl)
  const code = (await (await response).text()).replace(
    /\bimport "\/iife\/@fs\/.+?\/client\/env\.mjs"/,
    '',
  )
  const map = extractSourcemap(code)
  expect(formatSourcemapForSnapshot(map, code, true)).toMatchInlineSnapshot(`
    SourceMap {
      content: {
        "ignoreList": [],
        "mappings": ";;AAAA,SAAS,OAAO,kBAAkB;AAClC,OAAO,YAAY;AACnB,SAAS,MAAM,WAAW;AAC1B,SAAS,wBAAwB;AACjC,OAAO,aAAa;AACpB,MAAM,UAAU,OAAO,KAAK;AAE5B,KAAK,aAAa,MAAM;CACtB,IAAI,EAAE,SAAS,QAAQ;EACrB,KAAK,YAAY;GACf;GACA;GACA;GACA;GACA;GACA;GACA;GACD,CAAC;;CAEJ,IAAI,EAAE,SAAS,gBAAgB;EAC7B,KAAK,YAAY;GACf,KAAK;GACL;GACA;GACA;GACA;GACA;GACA;GACD,CAAC;;;AAGN,KAAK,YAAY;CACf;CACA;CACA;CACA;CACA;CACA;CACA;CACA;CACD,CAAC;;AAGF,QAAQ,IAAI,eAAe",
        "sources": [
          "my-worker.ts?worker_file&type=module",
        ],
        "version": 3,
      },
      visualization: "https://evanw.github.io/source-map-visualization/#OTg5AGNvbnN0IGRlcENqcyA9IF9fdml0ZV9fY2pzSW1wb3J0Ml9fdml0ZWpzX3Rlc3RXb3JrZXJEZXBDanM7CjsKaW1wb3J0IHsgbXNnIGFzIG1zZ0Zyb21EZXAgfSBmcm9tICIvaWlmZS9ub2RlX21vZHVsZXMvLnZpdGUtaWlmZS9kZXBzL0B2aXRlanNfdGVzdC1kZXAtdG8tb3B0aW1pemUuanM/dj0wMDAwMDAwMCI7CmltcG9ydCBfX3ZpdGVfX2Nqc0ltcG9ydDJfX3ZpdGVqc190ZXN0V29ya2VyRGVwQ2pzIGZyb20gIi9paWZlL25vZGVfbW9kdWxlcy8udml0ZS1paWZlL2RlcHMvQHZpdGVqc190ZXN0LXdvcmtlci1kZXAtY2pzLmpzP3Y9MDAwMDAwMDAiOwppbXBvcnQgeyBtb2RlLCBtc2cgfSBmcm9tICIvaWlmZS9tb2R1bGVzL3dvcmtlckltcG9ydC50cyI7CmltcG9ydCB7IGJ1bmRsZVdpdGhQbHVnaW4gfSBmcm9tICIvaWlmZS9tb2R1bGVzL3Rlc3QtcGx1Z2luLmpzIjsKaW1wb3J0IHZpdGVTdmcgZnJvbSAiL2lpZmUvdml0ZS5zdmc/aW1wb3J0IjsKY29uc3QgbWV0YVVybCA9IGltcG9ydC5tZXRhLnVybDsKc2VsZi5vbm1lc3NhZ2UgPSAoZSkgPT4gewoJaWYgKGUuZGF0YSA9PT0gInBpbmciKSB7CgkJc2VsZi5wb3N0TWVzc2FnZSh7CgkJCW1zZywKCQkJbW9kZSwKCQkJYnVuZGxlV2l0aFBsdWdpbiwKCQkJdml0ZVN2ZywKCQkJbWV0YVVybCwKCQkJbmFtZSwKCQkJZGVwQ2pzCgkJfSk7Cgl9CglpZiAoZS5kYXRhID09PSAicGluZy11bmljb2RlIikgewoJCXNlbGYucG9zdE1lc3NhZ2UoewoJCQltc2c6ICLigKJwb25n4oCiIiwKCQkJbW9kZSwKCQkJYnVuZGxlV2l0aFBsdWdpbiwKCQkJdml0ZVN2ZywKCQkJbWV0YVVybCwKCQkJbmFtZSwKCQkJZGVwQ2pzCgkJfSk7Cgl9Cn07CnNlbGYucG9zdE1lc3NhZ2UoewoJbXNnLAoJbW9kZSwKCWJ1bmRsZVdpdGhQbHVnaW4sCgltc2dGcm9tRGVwLAoJdml0ZVN2ZywKCW1ldGFVcmwsCgluYW1lLAoJZGVwQ2pzCn0pOwovLyBmb3Igc291cmNlbWFwCmNvbnNvbGUubG9nKCJteS13b3JrZXIuanMiKTsKMTM5NgB7InZlcnNpb24iOjMsIm1hcHBpbmdzIjoiOztBQUFBLFNBQVMsT0FBTyxrQkFBa0I7QUFDbEMsT0FBTyxZQUFZO0FBQ25CLFNBQVMsTUFBTSxXQUFXO0FBQzFCLFNBQVMsd0JBQXdCO0FBQ2pDLE9BQU8sYUFBYTtBQUNwQixNQUFNLFVBQVUsT0FBTyxLQUFLO0FBRTVCLEtBQUssYUFBYSxNQUFNO0NBQ3RCLElBQUksRUFBRSxTQUFTLFFBQVE7RUFDckIsS0FBSyxZQUFZO0dBQ2Y7R0FDQTtHQUNBO0dBQ0E7R0FDQTtHQUNBO0dBQ0E7R0FDRCxDQUFDOztDQUVKLElBQUksRUFBRSxTQUFTLGdCQUFnQjtFQUM3QixLQUFLLFlBQVk7R0FDZixLQUFLO0dBQ0w7R0FDQTtHQUNBO0dBQ0E7R0FDQTtHQUNBO0dBQ0QsQ0FBQzs7O0FBR04sS0FBSyxZQUFZO0NBQ2Y7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNELENBQUM7O0FBR0YsUUFBUSxJQUFJLGVBQWUiLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJteS13b3JrZXIudHM/d29ya2VyX2ZpbGUmdHlwZT1tb2R1bGUiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgbXNnIGFzIG1zZ0Zyb21EZXAgfSBmcm9tICdAdml0ZWpzL3Rlc3QtZGVwLXRvLW9wdGltaXplJ1xuaW1wb3J0IGRlcENqcyBmcm9tICdAdml0ZWpzL3Rlc3Qtd29ya2VyLWRlcC1janMnXG5pbXBvcnQgeyBtb2RlLCBtc2cgfSBmcm9tICcuL21vZHVsZXMvd29ya2VySW1wb3J0LmpzJ1xuaW1wb3J0IHsgYnVuZGxlV2l0aFBsdWdpbiB9IGZyb20gJy4vbW9kdWxlcy90ZXN0LXBsdWdpbidcbmltcG9ydCB2aXRlU3ZnIGZyb20gJy4vdml0ZS5zdmcnXG5jb25zdCBtZXRhVXJsID0gaW1wb3J0Lm1ldGEudXJsXG5cbnNlbGYub25tZXNzYWdlID0gKGUpID0+IHtcbiAgaWYgKGUuZGF0YSA9PT0gJ3BpbmcnKSB7XG4gICAgc2VsZi5wb3N0TWVzc2FnZSh7XG4gICAgICBtc2csXG4gICAgICBtb2RlLFxuICAgICAgYnVuZGxlV2l0aFBsdWdpbixcbiAgICAgIHZpdGVTdmcsXG4gICAgICBtZXRhVXJsLFxuICAgICAgbmFtZSxcbiAgICAgIGRlcENqcyxcbiAgICB9KVxuICB9XG4gIGlmIChlLmRhdGEgPT09ICdwaW5nLXVuaWNvZGUnKSB7XG4gICAgc2VsZi5wb3N0TWVzc2FnZSh7XG4gICAgICBtc2c6ICfigKJwb25n4oCiJyxcbiAgICAgIG1vZGUsXG4gICAgICBidW5kbGVXaXRoUGx1Z2luLFxuICAgICAgdml0ZVN2ZyxcbiAgICAgIG1ldGFVcmwsXG4gICAgICBuYW1lLFxuICAgICAgZGVwQ2pzLFxuICAgIH0pXG4gIH1cbn1cbnNlbGYucG9zdE1lc3NhZ2Uoe1xuICBtc2csXG4gIG1vZGUsXG4gIGJ1bmRsZVdpdGhQbHVnaW4sXG4gIG1zZ0Zyb21EZXAsXG4gIHZpdGVTdmcsXG4gIG1ldGFVcmwsXG4gIG5hbWUsXG4gIGRlcENqcyxcbn0pXG5cbi8vIGZvciBzb3VyY2VtYXBcbmNvbnNvbGUubG9nKCdteS13b3JrZXIuanMnKVxuIl19"
    }
  `)
})
