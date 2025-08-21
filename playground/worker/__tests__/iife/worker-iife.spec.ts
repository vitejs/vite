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
    expect(workerContent).not.toMatch(`import`)
    expect(workerContent).not.toMatch(`export`)
    // chunk
    expect(content).toMatch(`new Worker("/iife/assets`)
    expect(content).toMatch(`new SharedWorker("/iife/assets`)
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
        "mappings": ";;AAAA,SAAS,OAAO,kBAAkB;AAClC,OAAO,YAAY;AACnB,SAAS,MAAM,WAAW;AAC1B,SAAS,wBAAwB;AACjC,OAAO,aAAa;AACpB,MAAM,UAAU,YAAY;AAE5B,KAAK,YAAY,CAAC,MAAM;AACtB,MAAI,EAAE,SAAS,QAAQ;AACrB,SAAK,YAAY;AAAA,MACf;AAAA,MACA;AAAA,MACA;AAAA,MACA;AAAA,MACA;AAAA,MACA;AAAA,MACA;AAAA,IACF,CAAC;AAAA,EACH;AACA,MAAI,EAAE,SAAS,gBAAgB;AAC7B,SAAK,YAAY;AAAA,MACf,KAAK;AAAA,MACL;AAAA,MACA;AAAA,MACA;AAAA,MACA;AAAA,MACA;AAAA,MACA;AAAA,IACF,CAAC;AAAA,EACH;AACF;AACA,KAAK,YAAY;AAAA,EACf;AAAA,EACA;AAAA,EACA;AAAA,EACA;AAAA,EACA;AAAA,EACA;AAAA,EACA;AAAA,EACA;AACF,CAAC;AAGD,QAAQ,IAAI,cAAc",
        "sources": [
          "my-worker.ts?worker_file&type=module",
        ],
        "version": 3,
      },
      visualization: "https://evanw.github.io/source-map-visualization/#MTE0NgAKOwppbXBvcnQgeyBtc2cgYXMgbXNnRnJvbURlcCB9IGZyb20gIi9paWZlL25vZGVfbW9kdWxlcy8udml0ZS1paWZlL2RlcHMvQHZpdGVqc190ZXN0LWRlcC10by1vcHRpbWl6ZS5qcz92PTAwMDAwMDAwIjsKaW1wb3J0IF9fdml0ZV9fY2pzSW1wb3J0Ml9fdml0ZWpzX3Rlc3RXb3JrZXJEZXBDanMgZnJvbSAiL2lpZmUvbm9kZV9tb2R1bGVzLy52aXRlLWlpZmUvZGVwcy9Adml0ZWpzX3Rlc3Qtd29ya2VyLWRlcC1janMuanM/dj0wMDAwMDAwMCI7IGNvbnN0IGRlcENqcyA9IF9fdml0ZV9fY2pzSW1wb3J0Ml9fdml0ZWpzX3Rlc3RXb3JrZXJEZXBDanMuX19lc01vZHVsZSA/IF9fdml0ZV9fY2pzSW1wb3J0Ml9fdml0ZWpzX3Rlc3RXb3JrZXJEZXBDanMuZGVmYXVsdCA6IF9fdml0ZV9fY2pzSW1wb3J0Ml9fdml0ZWpzX3Rlc3RXb3JrZXJEZXBDanM7CmltcG9ydCB7IG1vZGUsIG1zZyB9IGZyb20gIi9paWZlL21vZHVsZXMvd29ya2VySW1wb3J0LnRzIjsKaW1wb3J0IHsgYnVuZGxlV2l0aFBsdWdpbiB9IGZyb20gIi9paWZlL21vZHVsZXMvdGVzdC1wbHVnaW4uanMiOwppbXBvcnQgdml0ZVN2ZyBmcm9tICIvaWlmZS92aXRlLnN2Zz9pbXBvcnQiOwpjb25zdCBtZXRhVXJsID0gaW1wb3J0Lm1ldGEudXJsOwpzZWxmLm9ubWVzc2FnZSA9IChlKSA9PiB7CiAgaWYgKGUuZGF0YSA9PT0gInBpbmciKSB7CiAgICBzZWxmLnBvc3RNZXNzYWdlKHsKICAgICAgbXNnLAogICAgICBtb2RlLAogICAgICBidW5kbGVXaXRoUGx1Z2luLAogICAgICB2aXRlU3ZnLAogICAgICBtZXRhVXJsLAogICAgICBuYW1lLAogICAgICBkZXBDanMKICAgIH0pOwogIH0KICBpZiAoZS5kYXRhID09PSAicGluZy11bmljb2RlIikgewogICAgc2VsZi5wb3N0TWVzc2FnZSh7CiAgICAgIG1zZzogIuKAonBvbmfigKIiLAogICAgICBtb2RlLAogICAgICBidW5kbGVXaXRoUGx1Z2luLAogICAgICB2aXRlU3ZnLAogICAgICBtZXRhVXJsLAogICAgICBuYW1lLAogICAgICBkZXBDanMKICAgIH0pOwogIH0KfTsKc2VsZi5wb3N0TWVzc2FnZSh7CiAgbXNnLAogIG1vZGUsCiAgYnVuZGxlV2l0aFBsdWdpbiwKICBtc2dGcm9tRGVwLAogIHZpdGVTdmcsCiAgbWV0YVVybCwKICBuYW1lLAogIGRlcENqcwp9KTsKY29uc29sZS5sb2coIm15LXdvcmtlci5qcyIpOwoxNTM3AHsidmVyc2lvbiI6MywibWFwcGluZ3MiOiI7O0FBQUEsU0FBUyxPQUFPLGtCQUFrQjtBQUNsQyxPQUFPLFlBQVk7QUFDbkIsU0FBUyxNQUFNLFdBQVc7QUFDMUIsU0FBUyx3QkFBd0I7QUFDakMsT0FBTyxhQUFhO0FBQ3BCLE1BQU0sVUFBVSxZQUFZO0FBRTVCLEtBQUssWUFBWSxDQUFDLE1BQU07QUFDdEIsTUFBSSxFQUFFLFNBQVMsUUFBUTtBQUNyQixTQUFLLFlBQVk7QUFBQSxNQUNmO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUNBLE1BQUksRUFBRSxTQUFTLGdCQUFnQjtBQUM3QixTQUFLLFlBQVk7QUFBQSxNQUNmLEtBQUs7QUFBQSxNQUNMO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQ0Y7QUFDQSxLQUFLLFlBQVk7QUFBQSxFQUNmO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUNGLENBQUM7QUFHRCxRQUFRLElBQUksY0FBYyIsImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIm15LXdvcmtlci50cz93b3JrZXJfZmlsZSZ0eXBlPW1vZHVsZSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBtc2cgYXMgbXNnRnJvbURlcCB9IGZyb20gJ0B2aXRlanMvdGVzdC1kZXAtdG8tb3B0aW1pemUnXG5pbXBvcnQgZGVwQ2pzIGZyb20gJ0B2aXRlanMvdGVzdC13b3JrZXItZGVwLWNqcydcbmltcG9ydCB7IG1vZGUsIG1zZyB9IGZyb20gJy4vbW9kdWxlcy93b3JrZXJJbXBvcnQuanMnXG5pbXBvcnQgeyBidW5kbGVXaXRoUGx1Z2luIH0gZnJvbSAnLi9tb2R1bGVzL3Rlc3QtcGx1Z2luJ1xuaW1wb3J0IHZpdGVTdmcgZnJvbSAnLi92aXRlLnN2ZydcbmNvbnN0IG1ldGFVcmwgPSBpbXBvcnQubWV0YS51cmxcblxuc2VsZi5vbm1lc3NhZ2UgPSAoZSkgPT4ge1xuICBpZiAoZS5kYXRhID09PSAncGluZycpIHtcbiAgICBzZWxmLnBvc3RNZXNzYWdlKHtcbiAgICAgIG1zZyxcbiAgICAgIG1vZGUsXG4gICAgICBidW5kbGVXaXRoUGx1Z2luLFxuICAgICAgdml0ZVN2ZyxcbiAgICAgIG1ldGFVcmwsXG4gICAgICBuYW1lLFxuICAgICAgZGVwQ2pzLFxuICAgIH0pXG4gIH1cbiAgaWYgKGUuZGF0YSA9PT0gJ3BpbmctdW5pY29kZScpIHtcbiAgICBzZWxmLnBvc3RNZXNzYWdlKHtcbiAgICAgIG1zZzogJ+KAonBvbmfigKInLFxuICAgICAgbW9kZSxcbiAgICAgIGJ1bmRsZVdpdGhQbHVnaW4sXG4gICAgICB2aXRlU3ZnLFxuICAgICAgbWV0YVVybCxcbiAgICAgIG5hbWUsXG4gICAgICBkZXBDanMsXG4gICAgfSlcbiAgfVxufVxuc2VsZi5wb3N0TWVzc2FnZSh7XG4gIG1zZyxcbiAgbW9kZSxcbiAgYnVuZGxlV2l0aFBsdWdpbixcbiAgbXNnRnJvbURlcCxcbiAgdml0ZVN2ZyxcbiAgbWV0YVVybCxcbiAgbmFtZSxcbiAgZGVwQ2pzLFxufSlcblxuLy8gZm9yIHNvdXJjZW1hcFxuY29uc29sZS5sb2coJ215LXdvcmtlci5qcycpXG4iXX0="
    }
  `)
})
