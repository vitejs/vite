import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { isBuild, page, testDir, untilUpdated } from '~utils'

test('normal', async () => {
  await untilUpdated(() => page.textContent('.pong'), 'pong', true)
  await untilUpdated(
    () => page.textContent('.mode'),
    process.env.NODE_ENV,
    true,
  )
  await untilUpdated(
    () => page.textContent('.bundle-with-plugin'),
    'worker bundle with plugin success!',
    true,
  )
  await untilUpdated(
    () => page.textContent('.asset-url'),
    isBuild ? '/es/assets/worker_asset-vite.svg' : '/es/vite.svg',
    true,
  )
})

test('named', async () => {
  await untilUpdated(() => page.textContent('.pong-named'), 'namedWorker', true)
})

test('TS output', async () => {
  await untilUpdated(() => page.textContent('.pong-ts-output'), 'pong', true)
})

test('inlined', async () => {
  await untilUpdated(() => page.textContent('.pong-inline'), 'pong', true)
})

test('named inlined', async () => {
  await untilUpdated(
    () => page.textContent('.pong-inline-named'),
    'namedInlineWorker',
    true,
  )
})

test('import meta url', async () => {
  await untilUpdated(
    () => page.textContent('.pong-inline-url'),
    /^(blob|http):/,
    true,
  )
})

test('unicode inlined', async () => {
  await untilUpdated(
    () => page.textContent('.pong-inline-unicode'),
    '•pong•',
    true,
  )
})

test('shared worker', async () => {
  await untilUpdated(() => page.textContent('.tick-count'), 'pong', true)
})

test('named shared worker', async () => {
  await untilUpdated(() => page.textContent('.tick-count-named'), 'pong', true)
})

test('inline shared worker', async () => {
  await untilUpdated(() => page.textContent('.pong-shared-inline'), 'pong')
})

test('worker emitted and import.meta.url in nested worker (serve)', async () => {
  await untilUpdated(
    () => page.textContent('.nested-worker'),
    'worker-nested-worker',
    true,
  )
  await untilUpdated(
    () => page.textContent('.nested-worker-module'),
    'sub-worker',
    true,
  )
  await untilUpdated(
    () => page.textContent('.nested-worker-constructor'),
    '"type":"constructor"',
    true,
  )
})

test('deeply nested workers', async () => {
  await untilUpdated(
    async () => page.textContent('.deeply-nested-worker'),
    /Hello\sfrom\sroot.*\/es\/.+deeply-nested-worker\.js/,
    true,
  )
  await untilUpdated(
    async () => page.textContent('.deeply-nested-second-worker'),
    /Hello\sfrom\ssecond.*\/es\/.+second-worker\.js/,
    true,
  )
  await untilUpdated(
    async () => page.textContent('.deeply-nested-third-worker'),
    /Hello\sfrom\sthird.*\/es\/.+third-worker\.js/,
    true,
  )
})

describe.runIf(isBuild)('build', () => {
  // assert correct files
  test('inlined code generation', async () => {
    const assetsDir = path.resolve(testDir, 'dist/es/assets')
    const files = fs.readdirSync(assetsDir)
    expect(files.length).toBe(32)
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
    expect(content).toMatch(`(window.URL||window.webkitURL).createObjectURL`)
    expect(content).toMatch(`window.Blob`)
    expect(content).toMatch(
      /try\{if\(\w+=\w+&&\(window\.URL\|\|window\.webkitURL\)\.createObjectURL\(\w+\),!\w+\)throw""/,
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
      true,
    )
    await untilUpdated(
      () => page.textContent('.nested-worker-constructor'),
      '"type":"constructor"',
      true,
    )
  })
})

test('module worker', async () => {
  await untilUpdated(
    () => page.textContent('.worker-import-meta-url'),
    'A string',
    true,
  )
  await untilUpdated(
    () => page.textContent('.worker-import-meta-url-resolve'),
    'A string',
    true,
  )
  await untilUpdated(
    () => page.textContent('.worker-import-meta-url-without-extension'),
    'A string',
    true,
  )
  await untilUpdated(
    () => page.textContent('.shared-worker-import-meta-url'),
    'A string',
    true,
  )
})

test('classic worker', async () => {
  await untilUpdated(
    () => page.textContent('.classic-worker'),
    'A classic',
    true,
  )
  await untilUpdated(
    () => page.textContent('.classic-worker-import'),
    '[success] classic-esm',
  )
  await untilUpdated(
    () => page.textContent('.classic-shared-worker'),
    'A classic',
    true,
  )
})

test('emit chunk', async () => {
  await untilUpdated(
    () => page.textContent('.emit-chunk-worker'),
    '["A string",{"type":"emit-chunk-sub-worker","data":"A string"},{"type":"module-and-worker:worker","data":"A string"},{"type":"module-and-worker:module","data":"module and worker"},{"type":"emit-chunk-sub-worker","data":{"module":"module and worker","msg1":"module1","msg2":"module2","msg3":"module3"}}]',
    true,
  )
  await untilUpdated(
    () => page.textContent('.emit-chunk-dynamic-import-worker'),
    '"A string/es/"',
    true,
  )
})

test('url query worker', async () => {
  await untilUpdated(
    () => page.textContent('.simple-worker-url'),
    'Hello from simple worker!',
    true,
  )
})

test('import.meta.glob in worker', async () => {
  await untilUpdated(
    () => page.textContent('.importMetaGlob-worker'),
    '["',
    true,
  )
})

test('import.meta.glob with eager in worker', async () => {
  await untilUpdated(
    () => page.textContent('.importMetaGlobEager-worker'),
    '["',
    true,
  )
})
