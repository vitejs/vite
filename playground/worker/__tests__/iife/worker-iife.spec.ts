import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import {
  expectWithRetry,
  isBuild,
  isServe,
  page,
  readManifest,
  testDir,
  untilUpdated,
  viteTestUrl,
} from '~utils'

test('normal', async () => {
  await untilUpdated(() => page.textContent('.pong'), 'pong')
  await untilUpdated(() => page.textContent('.mode'), process.env.NODE_ENV)
  await untilUpdated(
    () => page.textContent('.bundle-with-plugin'),
    'worker bundle with plugin success!',
  )
  await untilUpdated(
    () => page.textContent('.asset-url'),
    isBuild
      ? /\/iife\/assets\/worker_asset-vite-[\w-]{8}\.svg/
      : '/iife/vite.svg',
  )
})

test('named', async () => {
  await untilUpdated(() => page.textContent('.pong-named'), 'namedWorker')
})

test('TS output', async () => {
  await untilUpdated(() => page.textContent('.pong-ts-output'), 'pong')
})

test('inlined', async () => {
  await untilUpdated(() => page.textContent('.pong-inline'), 'pong')
})

test('named inlined', async () => {
  await untilUpdated(
    () => page.textContent('.pong-inline-named'),
    'namedInlineWorker',
  )
})

test('shared worker', async () => {
  await untilUpdated(() => page.textContent('.tick-count'), 'pong')
})

test('named shared worker', async () => {
  await untilUpdated(() => page.textContent('.tick-count-named'), 'pong')
})

test('inline shared worker', async () => {
  await untilUpdated(() => page.textContent('.pong-shared-inline'), 'pong')
})

test.runIf(!isBuild)(
  'worker emitted and import.meta.url in nested worker (serve)',
  async () => {
    await untilUpdated(
      () => page.textContent('.nested-worker'),
      '/worker-nested',
    )
    await untilUpdated(
      () => page.textContent('.nested-worker-module'),
      '/sub-worker',
    )
    await untilUpdated(
      () => page.textContent('.nested-worker-constructor'),
      '"type":"constructor"',
    )
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
    await untilUpdated(
      () => page.textContent('.nested-worker-module'),
      '"type":"module"',
    )
    await untilUpdated(
      () => page.textContent('.nested-worker-constructor'),
      '"type":"constructor"',
    )
  })

  test('should not emit worker manifest', async () => {
    const manifest = readManifest('iife')
    expect(manifest['index.html']).toBeDefined()
  })
})

test('module worker', async () => {
  await untilUpdated(
    async () => page.textContent('.worker-import-meta-url'),
    /A\sstring.*\/iife\/.+url-worker\.js.+url-worker\.js/,
  )
  await untilUpdated(
    () => page.textContent('.worker-import-meta-url-resolve'),
    /A\sstring.*\/iife\/.+url-worker\.js.+url-worker\.js/,
  )
  await untilUpdated(
    () => page.textContent('.worker-import-meta-url-without-extension'),
    /A\sstring.*\/iife\/.+url-worker\.js.+url-worker\.js/,
  )
  await untilUpdated(
    () => page.textContent('.shared-worker-import-meta-url'),
    'A string',
  )
})

test('classic worker', async () => {
  await untilUpdated(() => page.textContent('.classic-worker'), 'A classic')
  if (!isBuild) {
    await untilUpdated(
      () => page.textContent('.classic-worker-import'),
      '[success] classic-esm',
    )
  }
  await untilUpdated(
    () => page.textContent('.classic-shared-worker'),
    'A classic',
  )
})

test('url query worker', async () => {
  await untilUpdated(
    () => page.textContent('.simple-worker-url'),
    'Hello from simple worker!',
  )
})

test('import.meta.glob eager in worker', async () => {
  await untilUpdated(
    () => page.textContent('.importMetaGlobEager-worker'),
    '["',
  )
})

test('self reference worker', async () => {
  await expectWithRetry(() => page.textContent('.self-reference-worker')).toBe(
    'pong: main\npong: nested\n',
  )
})

test('self reference url worker', async () => {
  await expectWithRetry(() =>
    page.textContent('.self-reference-url-worker'),
  ).toBe('pong: main\npong: nested\n')
})

test('self reference url worker in dependency', async () => {
  await expectWithRetry(() =>
    page.textContent('.self-reference-url-worker-dep'),
  ).toBe('pong: main\npong: nested\n')
})

test.runIf(isServe)('sourcemap is correct after env is injected', async () => {
  const response = page.waitForResponse(
    /my-worker\.ts\?worker_file&type=module/,
  )
  await page.goto(viteTestUrl)
  const content = await (await response).text()
  const { mappings } = decodeSourceMapUrl(content)
  expect(mappings).toMatchInlineSnapshot(
    `";;AAAA,SAAS,OAAO,kBAAkB;AAClC,OAAO,YAAY;AACnB,SAAS,MAAM,WAAW;AAC1B,SAAS,wBAAwB;AACjC,OAAO,aAAa;AACpB,MAAM,UAAU,YAAY;AAE5B,KAAK,YAAY,CAAC,MAAM;AACtB,MAAI,EAAE,SAAS,QAAQ;AACrB,SAAK,YAAY;AAAA,MACf;AAAA,MACA;AAAA,MACA;AAAA,MACA;AAAA,MACA;AAAA,MACA;AAAA,MACA;AAAA,IACF,CAAC;AAAA,EACH;AACA,MAAI,EAAE,SAAS,gBAAgB;AAC7B,SAAK,YAAY;AAAA,MACf,KAAK;AAAA,MACL;AAAA,MACA;AAAA,MACA;AAAA,MACA;AAAA,MACA;AAAA,MACA;AAAA,IACF,CAAC;AAAA,EACH;AACF;AACA,KAAK,YAAY;AAAA,EACf;AAAA,EACA;AAAA,EACA;AAAA,EACA;AAAA,EACA;AAAA,EACA;AAAA,EACA;AAAA,EACA;AACF,CAAC;AAGD,QAAQ,IAAI,cAAc"`,
  )
})

function decodeSourceMapUrl(content: string) {
  return JSON.parse(
    Buffer.from(
      content.match(
        /\/\/[#@]\ssourceMappingURL=\s*data:application\/json;base64,(\S+)/,
      )?.[1],
      'base64',
    ).toString(),
  )
}
