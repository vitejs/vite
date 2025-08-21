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
    expect(files.length).toBe(23)
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
    /^import "\/iife\/@fs\/.+?\/client\/env\.mjs"/,
    '',
  )
  const map = extractSourcemap(code)
  expect(formatSourcemapForSnapshot(map, code, true)).toMatchInlineSnapshot(`
    SourceMap {
      content: {
        "ignoreList": [],
        "mappings": ";;AAAA,SAAS,OAAO,kBAAkB;AAClC,OAAO,YAAY;AACnB,SAAS,MAAM,WAAW;AAC1B,SAAS,wBAAwB;AACjC,OAAO,aAAa;AACpB,MAAM,UAAU,OAAO,KAAK;AAE5B,KAAK,aAAa,MAAM;AACtB,KAAI,EAAE,SAAS,QAAQ;AACrB,OAAK,YAAY;GACf;GACA;GACA;GACA;GACA;GACA;GACA;GACD;CACF;AACD,KAAI,EAAE,SAAS,gBAAgB;AAC7B,OAAK,YAAY;GACf,KAAK;GACL;GACA;GACA;GACA;GACA;GACA;GACD;CACF;AACF;AACD,KAAK,YAAY;CACf;CACA;CACA;CACA;CACA;CACA;CACA;CACA;CACD;;AAGD,QAAQ,IAAI",
        "sources": [
          "my-worker.ts?worker_file&type=module",
        ],
        "version": 3,
      },
      visualization: "https://evanw.github.io/source-map-visualization/#MTEwMQAKOwppbXBvcnQgeyBtc2cgYXMgbXNnRnJvbURlcCB9IGZyb20gIi9paWZlL25vZGVfbW9kdWxlcy8udml0ZS1paWZlL2RlcHMvQHZpdGVqc190ZXN0LWRlcC10by1vcHRpbWl6ZS5qcz92PTAwMDAwMDAwIjsKaW1wb3J0IF9fdml0ZV9fY2pzSW1wb3J0Ml9fdml0ZWpzX3Rlc3RXb3JrZXJEZXBDanMgZnJvbSAiL2lpZmUvbm9kZV9tb2R1bGVzLy52aXRlLWlpZmUvZGVwcy9Adml0ZWpzX3Rlc3Qtd29ya2VyLWRlcC1janMuanM/dj0wMDAwMDAwMCI7IGNvbnN0IGRlcENqcyA9IF9fdml0ZV9fY2pzSW1wb3J0Ml9fdml0ZWpzX3Rlc3RXb3JrZXJEZXBDanMuX19lc01vZHVsZSA/IF9fdml0ZV9fY2pzSW1wb3J0Ml9fdml0ZWpzX3Rlc3RXb3JrZXJEZXBDanMuZGVmYXVsdCA6IF9fdml0ZV9fY2pzSW1wb3J0Ml9fdml0ZWpzX3Rlc3RXb3JrZXJEZXBDanM7CmltcG9ydCB7IG1vZGUsIG1zZyB9IGZyb20gIi9paWZlL21vZHVsZXMvd29ya2VySW1wb3J0LnRzIjsKaW1wb3J0IHsgYnVuZGxlV2l0aFBsdWdpbiB9IGZyb20gIi9paWZlL21vZHVsZXMvdGVzdC1wbHVnaW4uanMiOwppbXBvcnQgdml0ZVN2ZyBmcm9tICIvaWlmZS92aXRlLnN2Zz9pbXBvcnQiOwpjb25zdCBtZXRhVXJsID0gaW1wb3J0Lm1ldGEudXJsOwpzZWxmLm9ubWVzc2FnZSA9IChlKSA9PiB7CglpZiAoZS5kYXRhID09PSAicGluZyIpIHsKCQlzZWxmLnBvc3RNZXNzYWdlKHsKCQkJbXNnLAoJCQltb2RlLAoJCQlidW5kbGVXaXRoUGx1Z2luLAoJCQl2aXRlU3ZnLAoJCQltZXRhVXJsLAoJCQluYW1lLAoJCQlkZXBDanMKCQl9KTsKCX0KCWlmIChlLmRhdGEgPT09ICJwaW5nLXVuaWNvZGUiKSB7CgkJc2VsZi5wb3N0TWVzc2FnZSh7CgkJCW1zZzogIuKAonBvbmfigKIiLAoJCQltb2RlLAoJCQlidW5kbGVXaXRoUGx1Z2luLAoJCQl2aXRlU3ZnLAoJCQltZXRhVXJsLAoJCQluYW1lLAoJCQlkZXBDanMKCQl9KTsKCX0KfTsKc2VsZi5wb3N0TWVzc2FnZSh7Cgltc2csCgltb2RlLAoJYnVuZGxlV2l0aFBsdWdpbiwKCW1zZ0Zyb21EZXAsCgl2aXRlU3ZnLAoJbWV0YVVybCwKCW5hbWUsCglkZXBDanMKfSk7Ci8vIGZvciBzb3VyY2VtYXAKY29uc29sZS5sb2coIm15LXdvcmtlci5qcyIpOwoxMzg4AHsidmVyc2lvbiI6MywibWFwcGluZ3MiOiI7O0FBQUEsU0FBUyxPQUFPLGtCQUFrQjtBQUNsQyxPQUFPLFlBQVk7QUFDbkIsU0FBUyxNQUFNLFdBQVc7QUFDMUIsU0FBUyx3QkFBd0I7QUFDakMsT0FBTyxhQUFhO0FBQ3BCLE1BQU0sVUFBVSxPQUFPLEtBQUs7QUFFNUIsS0FBSyxhQUFhLE1BQU07QUFDdEIsS0FBSSxFQUFFLFNBQVMsUUFBUTtBQUNyQixPQUFLLFlBQVk7R0FDZjtHQUNBO0dBQ0E7R0FDQTtHQUNBO0dBQ0E7R0FDQTtHQUNEO0NBQ0Y7QUFDRCxLQUFJLEVBQUUsU0FBUyxnQkFBZ0I7QUFDN0IsT0FBSyxZQUFZO0dBQ2YsS0FBSztHQUNMO0dBQ0E7R0FDQTtHQUNBO0dBQ0E7R0FDQTtHQUNEO0NBQ0Y7QUFDRjtBQUNELEtBQUssWUFBWTtDQUNmO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDRDs7QUFHRCxRQUFRLElBQUkiLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJteS13b3JrZXIudHM/d29ya2VyX2ZpbGUmdHlwZT1tb2R1bGUiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgbXNnIGFzIG1zZ0Zyb21EZXAgfSBmcm9tICdAdml0ZWpzL3Rlc3QtZGVwLXRvLW9wdGltaXplJ1xuaW1wb3J0IGRlcENqcyBmcm9tICdAdml0ZWpzL3Rlc3Qtd29ya2VyLWRlcC1janMnXG5pbXBvcnQgeyBtb2RlLCBtc2cgfSBmcm9tICcuL21vZHVsZXMvd29ya2VySW1wb3J0LmpzJ1xuaW1wb3J0IHsgYnVuZGxlV2l0aFBsdWdpbiB9IGZyb20gJy4vbW9kdWxlcy90ZXN0LXBsdWdpbidcbmltcG9ydCB2aXRlU3ZnIGZyb20gJy4vdml0ZS5zdmcnXG5jb25zdCBtZXRhVXJsID0gaW1wb3J0Lm1ldGEudXJsXG5cbnNlbGYub25tZXNzYWdlID0gKGUpID0+IHtcbiAgaWYgKGUuZGF0YSA9PT0gJ3BpbmcnKSB7XG4gICAgc2VsZi5wb3N0TWVzc2FnZSh7XG4gICAgICBtc2csXG4gICAgICBtb2RlLFxuICAgICAgYnVuZGxlV2l0aFBsdWdpbixcbiAgICAgIHZpdGVTdmcsXG4gICAgICBtZXRhVXJsLFxuICAgICAgbmFtZSxcbiAgICAgIGRlcENqcyxcbiAgICB9KVxuICB9XG4gIGlmIChlLmRhdGEgPT09ICdwaW5nLXVuaWNvZGUnKSB7XG4gICAgc2VsZi5wb3N0TWVzc2FnZSh7XG4gICAgICBtc2c6ICfigKJwb25n4oCiJyxcbiAgICAgIG1vZGUsXG4gICAgICBidW5kbGVXaXRoUGx1Z2luLFxuICAgICAgdml0ZVN2ZyxcbiAgICAgIG1ldGFVcmwsXG4gICAgICBuYW1lLFxuICAgICAgZGVwQ2pzLFxuICAgIH0pXG4gIH1cbn1cbnNlbGYucG9zdE1lc3NhZ2Uoe1xuICBtc2csXG4gIG1vZGUsXG4gIGJ1bmRsZVdpdGhQbHVnaW4sXG4gIG1zZ0Zyb21EZXAsXG4gIHZpdGVTdmcsXG4gIG1ldGFVcmwsXG4gIG5hbWUsXG4gIGRlcENqcyxcbn0pXG5cbi8vIGZvciBzb3VyY2VtYXBcbmNvbnNvbGUubG9nKCdteS13b3JrZXIuanMnKVxuIl19"
    }
  `)
})
