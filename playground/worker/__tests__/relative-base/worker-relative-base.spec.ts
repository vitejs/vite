import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { isBuild, page, testDir, untilUpdated } from '~utils'

test('normal', async () => {
  await untilUpdated(() => page.textContent('.pong'), 'pong')
  await untilUpdated(() => page.textContent('.mode'), process.env.NODE_ENV)
  await untilUpdated(
    () => page.textContent('.bundle-with-plugin'),
    'worker bundle with plugin success!',
  )
  await untilUpdated(
    () => page.textContent('.asset-url'),
    isBuild ? '/worker-assets/worker_asset-vite' : '/vite.svg',
  )
})

test('named', async () => {
  await untilUpdated(() => page.textContent('.pong-named'), 'namedWorker')
})

test('TS output', async () => {
  await untilUpdated(() => page.textContent('.pong-ts-output'), 'pong')
})

// TODO: inline worker should inline assets
test.skip('inlined', async () => {
  await untilUpdated(() => page.textContent('.pong-inline'), 'pong')
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

describe.runIf(isBuild)('build', () => {
  // assert correct files
  test('inlined code generation', () => {
    const chunksDir = path.resolve(testDir, 'dist/relative-base/chunks')
    const files = fs.readdirSync(chunksDir)
    const index = files.find((f) => f.includes('main-module'))
    const content = fs.readFileSync(path.resolve(chunksDir, index), 'utf-8')
    const workerEntriesDir = path.resolve(
      testDir,
      'dist/relative-base/worker-entries',
    )
    const workerFiles = fs.readdirSync(workerEntriesDir)
    const worker = workerFiles.find((f) => f.includes('worker_entry-my-worker'))
    const workerContent = fs.readFileSync(
      path.resolve(workerEntriesDir, worker),
      'utf-8',
    )

    // worker should have all imports resolved and no exports
    expect(workerContent).not.toMatch(/import(?!\.)/) // accept import.meta.url
    expect(workerContent).not.toMatch(`export`)
    // chunk
    expect(content).toMatch(`new Worker(""+new URL("../worker-entries/`)
    expect(content).toMatch(`new SharedWorker(""+new URL("../worker-entries/`)
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
})

test('module worker', async () => {
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

test.runIf(isBuild)('emit chunk', async () => {
  await untilUpdated(
    () => page.textContent('.emit-chunk-worker'),
    '["A string",{"type":"emit-chunk-sub-worker","data":"A string"},{"type":"module-and-worker:worker","data":"A string"},{"type":"module-and-worker:module","data":"module and worker"},{"type":"emit-chunk-sub-worker","data":{"module":"module and worker","msg1":"module1","msg2":"module2","msg3":"module3"}}]',
  )
  await untilUpdated(
    () => page.textContent('.emit-chunk-dynamic-import-worker'),
    '"A stringmodule1./"',
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
  await expect
    .poll(() => page.textContent('.self-reference-worker'))
    .toBe('pong: main\npong: nested\n')
})

test('self reference url worker', async () => {
  await expect
    .poll(() => page.textContent('.self-reference-url-worker'))
    .toBe('pong: main\npong: nested\n')
})
