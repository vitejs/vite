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

test('TS output', async () => {
  await untilUpdated(() => page.textContent('.pong-ts-output'), 'pong', true)
})

test('inlined', async () => {
  await untilUpdated(() => page.textContent('.pong-inline'), 'pong', true)
})

test('shared worker', async () => {
  await untilUpdated(() => page.textContent('.tick-count'), 'pong', true)
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

describe.runIf(isBuild)('build', () => {
  // assert correct files
  test('inlined code generation', async () => {
    const assetsDir = path.resolve(testDir, 'dist/es/assets')
    const files = fs.readdirSync(assetsDir)
    expect(files.length).toBe(28)
    const index = files.find((f) => f.includes('main-module'))
    const content = fs.readFileSync(path.resolve(assetsDir, index), 'utf-8')
    const worker = files.find((f) => f.includes('my-worker'))
    const workerContent = fs.readFileSync(
      path.resolve(assetsDir, worker),
      'utf-8',
    )

    // worker should have all imports resolved and no exports
    expect(workerContent).not.toMatch(`import`)
    expect(workerContent).not.toMatch(`export`)
    // chunk
    expect(content).toMatch(`new Worker("/es/assets`)
    expect(content).toMatch(`new SharedWorker("/es/assets`)
    // inlined
    expect(content).toMatch(`(window.URL||window.webkitURL).createObjectURL`)
    expect(content).toMatch(`window.Blob`)
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
