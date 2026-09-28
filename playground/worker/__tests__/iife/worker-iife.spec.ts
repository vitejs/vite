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
  const responsePromise = page.waitForResponse(
    /my-worker\.ts\?worker_file&type=module/,
  )
  await page.goto(viteTestUrl)
  const response = await responsePromise
  const code = (await response.text()).replace(
    /\bimport "\/iife\/@fs\/.+?\/client\/env\.mjs"/,
    '',
  )
  // references its sourcemap via an external `.map` file instead of inlining
  // it as a base64 data URI, since a single large inline map can freeze some
  // devtools implementations when parsed
  // (https://github.com/vitejs/vite/issues/23549)
  const map = await extractSourcemap(code, async (url) => {
    const mapRes = await page.request.get(new URL(url, response.url()).href)
    expect(mapRes.status()).toBe(200)
    return mapRes.text()
  })
  expect(formatSourcemapForSnapshot(map, code, true)).toMatchInlineSnapshot(`
    SourceMap {
      content: {
        "mappings": ";;AAAA,SAAS,OAAO,kBAAkB;AAClC,OAAO,YAAY;AACnB,SAAS,wBAAwB;AACjC,SAAS,MAAM,WAAW;AAC1B,OAAO,aAAa;AACpB,MAAM,UAAU,YAAY;AAE5B,KAAK,aAAa,MAAM;CACtB,IAAI,EAAE,SAAS,QAAQ;EACrB,KAAK,YAAY;GACf;GACA;GACA;GACA;GACA;GACA;GACA;EACF,CAAC;CACH;CACA,IAAI,EAAE,SAAS,gBAAgB;EAC7B,KAAK,YAAY;GACf,KAAK;GACL;GACA;GACA;GACA;GACA;GACA;EACF,CAAC;CACH;AACF;AACA,KAAK,YAAY;CACf;CACA;CACA;CACA;CACA;CACA;CACA;CACA;AACF,CAAC;;AAGD,QAAQ,IAAI,cAAc",
        "sources": [
          "my-worker.ts?worker_file&type=module",
        ],
        "version": 3,
      },
      visualization: "https://evanw.github.io/source-map-visualization/#MTA1NwBjb25zdCBkZXBDanMgPSBfX3ZpdGVfX2Nqc0ltcG9ydDJfX3ZpdGVqc190ZXN0V29ya2VyRGVwQ2pzOwo7CmltcG9ydCB7IG1zZyBhcyBtc2dGcm9tRGVwIH0gZnJvbSAiL2lpZmUvbm9kZV9tb2R1bGVzLy52aXRlLWlpZmUvZGVwcy9Adml0ZWpzX3Rlc3QtZGVwLXRvLW9wdGltaXplLmpzP3Y9MDAwMDAwMDAiOwppbXBvcnQgX192aXRlX19janNJbXBvcnQyX192aXRlanNfdGVzdFdvcmtlckRlcENqcyBmcm9tICIvaWlmZS9ub2RlX21vZHVsZXMvLnZpdGUtaWlmZS9kZXBzL0B2aXRlanNfdGVzdC13b3JrZXItZGVwLWNqcy5qcz92PTAwMDAwMDAwIjsKaW1wb3J0IHsgYnVuZGxlV2l0aFBsdWdpbiB9IGZyb20gIi9paWZlL21vZHVsZXMvdGVzdC1wbHVnaW4uanMiOwppbXBvcnQgeyBtb2RlLCBtc2cgfSBmcm9tICIvaWlmZS9tb2R1bGVzL3dvcmtlckltcG9ydC50cyI7CmltcG9ydCB2aXRlU3ZnIGZyb20gIi9paWZlL3ZpdGUuc3ZnP2ltcG9ydCI7CmNvbnN0IG1ldGFVcmwgPSBpbXBvcnQubWV0YS51cmw7CnNlbGYub25tZXNzYWdlID0gKGUpID0+IHsKCWlmIChlLmRhdGEgPT09ICJwaW5nIikgewoJCXNlbGYucG9zdE1lc3NhZ2UoewoJCQltc2csCgkJCW1vZGUsCgkJCWJ1bmRsZVdpdGhQbHVnaW4sCgkJCXZpdGVTdmcsCgkJCW1ldGFVcmwsCgkJCW5hbWUsCgkJCWRlcENqcwoJCX0pOwoJfQoJaWYgKGUuZGF0YSA9PT0gInBpbmctdW5pY29kZSIpIHsKCQlzZWxmLnBvc3RNZXNzYWdlKHsKCQkJbXNnOiAi4oCicG9uZ+KAoiIsCgkJCW1vZGUsCgkJCWJ1bmRsZVdpdGhQbHVnaW4sCgkJCXZpdGVTdmcsCgkJCW1ldGFVcmwsCgkJCW5hbWUsCgkJCWRlcENqcwoJCX0pOwoJfQp9OwpzZWxmLnBvc3RNZXNzYWdlKHsKCW1zZywKCW1vZGUsCglidW5kbGVXaXRoUGx1Z2luLAoJbXNnRnJvbURlcCwKCXZpdGVTdmcsCgltZXRhVXJsLAoJbmFtZSwKCWRlcENqcwp9KTsKLy8gZm9yIHNvdXJjZW1hcApjb25zb2xlLmxvZygibXktd29ya2VyLmpzIik7CgovLyMgc291cmNlTWFwcGluZ1VSTD0vaWlmZS9teS13b3JrZXIudHMubWFwP3dvcmtlcl9maWxlJnR5cGU9bW9kdWxlMTM4NwB7Im1hcHBpbmdzIjoiOztBQUFBLFNBQVMsT0FBTyxrQkFBa0I7QUFDbEMsT0FBTyxZQUFZO0FBQ25CLFNBQVMsd0JBQXdCO0FBQ2pDLFNBQVMsTUFBTSxXQUFXO0FBQzFCLE9BQU8sYUFBYTtBQUNwQixNQUFNLFVBQVUsWUFBWTtBQUU1QixLQUFLLGFBQWEsTUFBTTtDQUN0QixJQUFJLEVBQUUsU0FBUyxRQUFRO0VBQ3JCLEtBQUssWUFBWTtHQUNmO0dBQ0E7R0FDQTtHQUNBO0dBQ0E7R0FDQTtHQUNBO0VBQ0YsQ0FBQztDQUNIO0NBQ0EsSUFBSSxFQUFFLFNBQVMsZ0JBQWdCO0VBQzdCLEtBQUssWUFBWTtHQUNmLEtBQUs7R0FDTDtHQUNBO0dBQ0E7R0FDQTtHQUNBO0dBQ0E7RUFDRixDQUFDO0NBQ0g7QUFDRjtBQUNBLEtBQUssWUFBWTtDQUNmO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7QUFDRixDQUFDOztBQUdELFFBQVEsSUFBSSxjQUFjIiwic291cmNlcyI6WyJteS13b3JrZXIudHM/d29ya2VyX2ZpbGUmdHlwZT1tb2R1bGUiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgbXNnIGFzIG1zZ0Zyb21EZXAgfSBmcm9tICdAdml0ZWpzL3Rlc3QtZGVwLXRvLW9wdGltaXplJ1xuaW1wb3J0IGRlcENqcyBmcm9tICdAdml0ZWpzL3Rlc3Qtd29ya2VyLWRlcC1janMnXG5pbXBvcnQgeyBidW5kbGVXaXRoUGx1Z2luIH0gZnJvbSAnLi9tb2R1bGVzL3Rlc3QtcGx1Z2luJ1xuaW1wb3J0IHsgbW9kZSwgbXNnIH0gZnJvbSAnLi9tb2R1bGVzL3dvcmtlckltcG9ydC5qcydcbmltcG9ydCB2aXRlU3ZnIGZyb20gJy4vdml0ZS5zdmcnXG5jb25zdCBtZXRhVXJsID0gaW1wb3J0Lm1ldGEudXJsXG5cbnNlbGYub25tZXNzYWdlID0gKGUpID0+IHtcbiAgaWYgKGUuZGF0YSA9PT0gJ3BpbmcnKSB7XG4gICAgc2VsZi5wb3N0TWVzc2FnZSh7XG4gICAgICBtc2csXG4gICAgICBtb2RlLFxuICAgICAgYnVuZGxlV2l0aFBsdWdpbixcbiAgICAgIHZpdGVTdmcsXG4gICAgICBtZXRhVXJsLFxuICAgICAgbmFtZSxcbiAgICAgIGRlcENqcyxcbiAgICB9KVxuICB9XG4gIGlmIChlLmRhdGEgPT09ICdwaW5nLXVuaWNvZGUnKSB7XG4gICAgc2VsZi5wb3N0TWVzc2FnZSh7XG4gICAgICBtc2c6ICfigKJwb25n4oCiJyxcbiAgICAgIG1vZGUsXG4gICAgICBidW5kbGVXaXRoUGx1Z2luLFxuICAgICAgdml0ZVN2ZyxcbiAgICAgIG1ldGFVcmwsXG4gICAgICBuYW1lLFxuICAgICAgZGVwQ2pzLFxuICAgIH0pXG4gIH1cbn1cbnNlbGYucG9zdE1lc3NhZ2Uoe1xuICBtc2csXG4gIG1vZGUsXG4gIGJ1bmRsZVdpdGhQbHVnaW4sXG4gIG1zZ0Zyb21EZXAsXG4gIHZpdGVTdmcsXG4gIG1ldGFVcmwsXG4gIG5hbWUsXG4gIGRlcENqcyxcbn0pXG5cbi8vIGZvciBzb3VyY2VtYXBcbmNvbnNvbGUubG9nKCdteS13b3JrZXIuanMnKVxuIl0sInZlcnNpb24iOjN9"
    }
  `)
})
