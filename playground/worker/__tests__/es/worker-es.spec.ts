import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { expectWithRetry, isBuild, page, testDir, untilUpdated } from '~utils'

test('normal', async () => {
  await untilUpdated(() => page.textContent('.pong'), 'pong')
  await untilUpdated(() => page.textContent('.mode'), process.env.NODE_ENV)
  await untilUpdated(
    () => page.textContent('.bundle-with-plugin'),
    'worker bundle with plugin success!',
  )
  await untilUpdated(
    () => page.textContent('.asset-url'),
    isBuild ? '/es/assets/worker_asset-vite.svg' : '/es/vite.svg',
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

test('import meta url', async () => {
  await untilUpdated(
    () => page.textContent('.pong-inline-url'),
    /^(blob|http):/,
  )
})

test('unicode inlined', async () => {
  await untilUpdated(() => page.textContent('.pong-inline-unicode'), '•pong•')
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

test('worker emitted and import.meta.url in nested worker (serve)', async () => {
  await untilUpdated(
    () => page.textContent('.nested-worker'),
    'worker-nested-worker',
  )
  await untilUpdated(
    () => page.textContent('.nested-worker-module'),
    'sub-worker',
  )
  await untilUpdated(
    () => page.textContent('.nested-worker-constructor'),
    '"type":"constructor"',
  )
})

test('deeply nested workers', async () => {
  await untilUpdated(
    async () => page.textContent('.deeply-nested-worker'),
    /Hello\sfrom\sroot.*\/es\/.+deeply-nested-worker\.js/,
  )
  await untilUpdated(
    async () => page.textContent('.deeply-nested-second-worker'),
    /Hello\sfrom\ssecond.*\/es\/.+second-worker\.js/,
  )
  await untilUpdated(
    async () => page.textContent('.deeply-nested-third-worker'),
    /Hello\sfrom\sthird.*\/es\/.+third-worker\.js/,
  )
})

describe.runIf(isBuild)('build', () => {
  // assert correct files
  test('inlined code generation', async () => {
    const assetsDir = path.resolve(testDir, 'dist/es/assets')
    const files = fs.readdirSync(assetsDir)
    expect(files.length).toBe(35)
    const index = files.find((f) => f.includes('main-module'))
    const content = fs.readFileSync(path.resolve(assetsDir, index), 'utf-8')
    const worker = files.find((f) => f.includes('my-worker'))
    const workerContent = fs.readFileSync(
      path.resolve(assetsDir, worker),
      'utf-8',
    )

    // worker should have all imports resolved and no exports
    expect(workerContent).not.toMatch(/import[^.]/)
    expect(workerContent).not.toMatch(`export`)
    // chunk
    expect(content).toMatch(`new Worker("/es/assets`)
    expect(content).toMatch(`new SharedWorker("/es/assets`)
    // inlined worker
    expect(content).toMatch(`(self.URL||self.webkitURL).createObjectURL`)
    expect(content).toMatch(`self.Blob`)
    expect(content).toMatch(
      /try\{if\(\w+=\w+&&\(self\.URL\|\|self\.webkitURL\)\.createObjectURL\(\w+\),!\w+\)throw""/,
    )
    // inlined shared worker
    expect(content).toMatch(
      `return new SharedWorker("data:text/javascript;base64,"+`,
    )
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
})

test('module worker', async () => {
  await untilUpdated(
    () => page.textContent('.worker-import-meta-url'),
    'A string',
  )
  await untilUpdated(
    () => page.textContent('.worker-import-meta-url-resolve'),
    'A string',
  )
  await untilUpdated(
    () => page.textContent('.worker-import-meta-url-without-extension'),
    'A string',
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

test('emit chunk', async () => {
  await untilUpdated(
    () => page.textContent('.emit-chunk-worker'),
    '["A string",{"type":"emit-chunk-sub-worker","data":"A string"},{"type":"module-and-worker:worker","data":"A string"},{"type":"module-and-worker:module","data":"module and worker"},{"type":"emit-chunk-sub-worker","data":{"module":"module and worker","msg1":"module1","msg2":"module2","msg3":"module3"}}]',
  )
  await untilUpdated(
    () => page.textContent('.emit-chunk-dynamic-import-worker'),
    '"A stringmodule1/es/"',
  )
})

test('url query worker', async () => {
  await untilUpdated(
    () => page.textContent('.simple-worker-url'),
    'Hello from simple worker!',
  )
})

test('import.meta.glob in worker', async () => {
  await untilUpdated(() => page.textContent('.importMetaGlob-worker'), '["')
})

test('import.meta.glob with eager in worker', async () => {
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
