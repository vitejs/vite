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
        "mappings": ";;AAAA,SAAS,OAAO,kBAAkB;AAClC,OAAO,YAAY;AACnB,SAAS,MAAM,WAAW;AAC1B,SAAS,wBAAwB;AACjC,OAAO,aAAa;AACpB,MAAM,UAAU,OAAO,KAAK;AAE5B,KAAK,aAAa,MAAM;AACtB,KAAI,EAAE,SAAS,QAAQ;AACrB,OAAK,YAAY;GACf;GACA;GACA;GACA;GACA;GACA;GACA;GACD,CAAC;;AAEJ,KAAI,EAAE,SAAS,gBAAgB;AAC7B,OAAK,YAAY;GACf,KAAK;GACL;GACA;GACA;GACA;GACA;GACA;GACD,CAAC;;;AAGN,KAAK,YAAY;CACf;CACA;CACA;CACA;CACA;CACA;CACA;CACA;CACD,CAAC;;AAGF,QAAQ,IAAI,eAAe",
        "sources": [
          "my-worker.ts?worker_file&type=module",
        ],
        "version": 3,
      },
      visualization: "https://evanw.github.io/source-map-visualization/#OTkwAAo7CmltcG9ydCB7IG1zZyBhcyBtc2dGcm9tRGVwIH0gZnJvbSAiL2lpZmUvbm9kZV9tb2R1bGVzLy52aXRlLWlpZmUvZGVwcy9Adml0ZWpzX3Rlc3QtZGVwLXRvLW9wdGltaXplLmpzP3Y9MDAwMDAwMDAiOwppbXBvcnQgX192aXRlX19janNJbXBvcnQyX192aXRlanNfdGVzdFdvcmtlckRlcENqcyBmcm9tICIvaWlmZS9ub2RlX21vZHVsZXMvLnZpdGUtaWlmZS9kZXBzL0B2aXRlanNfdGVzdC13b3JrZXItZGVwLWNqcy5qcz92PTAwMDAwMDAwIjsgY29uc3QgZGVwQ2pzID0gX192aXRlX19janNJbXBvcnQyX192aXRlanNfdGVzdFdvcmtlckRlcENqczsKaW1wb3J0IHsgbW9kZSwgbXNnIH0gZnJvbSAiL2lpZmUvbW9kdWxlcy93b3JrZXJJbXBvcnQudHMiOwppbXBvcnQgeyBidW5kbGVXaXRoUGx1Z2luIH0gZnJvbSAiL2lpZmUvbW9kdWxlcy90ZXN0LXBsdWdpbi5qcyI7CmltcG9ydCB2aXRlU3ZnIGZyb20gIi9paWZlL3ZpdGUuc3ZnP2ltcG9ydCI7CmNvbnN0IG1ldGFVcmwgPSBpbXBvcnQubWV0YS51cmw7CnNlbGYub25tZXNzYWdlID0gKGUpID0+IHsKCWlmIChlLmRhdGEgPT09ICJwaW5nIikgewoJCXNlbGYucG9zdE1lc3NhZ2UoewoJCQltc2csCgkJCW1vZGUsCgkJCWJ1bmRsZVdpdGhQbHVnaW4sCgkJCXZpdGVTdmcsCgkJCW1ldGFVcmwsCgkJCW5hbWUsCgkJCWRlcENqcwoJCX0pOwoJfQoJaWYgKGUuZGF0YSA9PT0gInBpbmctdW5pY29kZSIpIHsKCQlzZWxmLnBvc3RNZXNzYWdlKHsKCQkJbXNnOiAi4oCicG9uZ+KAoiIsCgkJCW1vZGUsCgkJCWJ1bmRsZVdpdGhQbHVnaW4sCgkJCXZpdGVTdmcsCgkJCW1ldGFVcmwsCgkJCW5hbWUsCgkJCWRlcENqcwoJCX0pOwoJfQp9OwpzZWxmLnBvc3RNZXNzYWdlKHsKCW1zZywKCW1vZGUsCglidW5kbGVXaXRoUGx1Z2luLAoJbXNnRnJvbURlcCwKCXZpdGVTdmcsCgltZXRhVXJsLAoJbmFtZSwKCWRlcENqcwp9KTsKLy8gZm9yIHNvdXJjZW1hcApjb25zb2xlLmxvZygibXktd29ya2VyLmpzIik7CjEzOTYAeyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7QUFBQSxTQUFTLE9BQU8sa0JBQWtCO0FBQ2xDLE9BQU8sWUFBWTtBQUNuQixTQUFTLE1BQU0sV0FBVztBQUMxQixTQUFTLHdCQUF3QjtBQUNqQyxPQUFPLGFBQWE7QUFDcEIsTUFBTSxVQUFVLE9BQU8sS0FBSztBQUU1QixLQUFLLGFBQWEsTUFBTTtBQUN0QixLQUFJLEVBQUUsU0FBUyxRQUFRO0FBQ3JCLE9BQUssWUFBWTtHQUNmO0dBQ0E7R0FDQTtHQUNBO0dBQ0E7R0FDQTtHQUNBO0dBQ0QsQ0FBQzs7QUFFSixLQUFJLEVBQUUsU0FBUyxnQkFBZ0I7QUFDN0IsT0FBSyxZQUFZO0dBQ2YsS0FBSztHQUNMO0dBQ0E7R0FDQTtHQUNBO0dBQ0E7R0FDQTtHQUNELENBQUM7OztBQUdOLEtBQUssWUFBWTtDQUNmO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDRCxDQUFDOztBQUdGLFFBQVEsSUFBSSxlQUFlIiwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsibXktd29ya2VyLnRzP3dvcmtlcl9maWxlJnR5cGU9bW9kdWxlIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IG1zZyBhcyBtc2dGcm9tRGVwIH0gZnJvbSAnQHZpdGVqcy90ZXN0LWRlcC10by1vcHRpbWl6ZSdcbmltcG9ydCBkZXBDanMgZnJvbSAnQHZpdGVqcy90ZXN0LXdvcmtlci1kZXAtY2pzJ1xuaW1wb3J0IHsgbW9kZSwgbXNnIH0gZnJvbSAnLi9tb2R1bGVzL3dvcmtlckltcG9ydC5qcydcbmltcG9ydCB7IGJ1bmRsZVdpdGhQbHVnaW4gfSBmcm9tICcuL21vZHVsZXMvdGVzdC1wbHVnaW4nXG5pbXBvcnQgdml0ZVN2ZyBmcm9tICcuL3ZpdGUuc3ZnJ1xuY29uc3QgbWV0YVVybCA9IGltcG9ydC5tZXRhLnVybFxuXG5zZWxmLm9ubWVzc2FnZSA9IChlKSA9PiB7XG4gIGlmIChlLmRhdGEgPT09ICdwaW5nJykge1xuICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgbXNnLFxuICAgICAgbW9kZSxcbiAgICAgIGJ1bmRsZVdpdGhQbHVnaW4sXG4gICAgICB2aXRlU3ZnLFxuICAgICAgbWV0YVVybCxcbiAgICAgIG5hbWUsXG4gICAgICBkZXBDanMsXG4gICAgfSlcbiAgfVxuICBpZiAoZS5kYXRhID09PSAncGluZy11bmljb2RlJykge1xuICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgbXNnOiAn4oCicG9uZ+KAoicsXG4gICAgICBtb2RlLFxuICAgICAgYnVuZGxlV2l0aFBsdWdpbixcbiAgICAgIHZpdGVTdmcsXG4gICAgICBtZXRhVXJsLFxuICAgICAgbmFtZSxcbiAgICAgIGRlcENqcyxcbiAgICB9KVxuICB9XG59XG5zZWxmLnBvc3RNZXNzYWdlKHtcbiAgbXNnLFxuICBtb2RlLFxuICBidW5kbGVXaXRoUGx1Z2luLFxuICBtc2dGcm9tRGVwLFxuICB2aXRlU3ZnLFxuICBtZXRhVXJsLFxuICBuYW1lLFxuICBkZXBDanMsXG59KVxuXG4vLyBmb3Igc291cmNlbWFwXG5jb25zb2xlLmxvZygnbXktd29ya2VyLmpzJylcbiJdfQ=="
    }
  `)
})
