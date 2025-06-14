import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { isBuild, page, testDir } from '~utils'

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
    .toMatch(isBuild ? '/worker-assets/worker_asset-vite' : '/vite.svg')
})

test('named', async () => {
  await expect
    .poll(() => page.textContent('.pong-named'))
    .toMatch('namedWorker')
})

test('TS output', async () => {
  await expect.poll(() => page.textContent('.pong-ts-output')).toMatch('pong')
})

// TODO: inline worker should inline assets
test.skip('inlined', async () => {
  await expect.poll(() => page.textContent('.pong-inline')).toMatch('pong')
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

test('worker emitted and import.meta.url in nested worker (serve)', async () => {
  await expect
    .poll(() => page.textContent('.nested-worker'))
    .toMatch('worker-nested-worker')
  await expect
    .poll(() => page.textContent('.nested-worker-module'))
    .toMatch('sub-worker')
  await expect
    .poll(() => page.textContent('.nested-worker-constructor'))
    .toMatch('"type":"constructor"')
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
    await expect
      .poll(() => page.textContent('.nested-worker-module'))
      .toMatch('"type":"module"')
    await expect
      .poll(() => page.textContent('.nested-worker-constructor'))
      .toMatch('"type":"constructor"')
  })
})

test('module worker', async () => {
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

test.runIf(isBuild)('emit chunk', async () => {
  await expect
    .poll(() => page.textContent('.emit-chunk-worker'))
    .toMatch(
      '["A string",{"type":"emit-chunk-sub-worker","data":"A string"},{"type":"module-and-worker:worker","data":"A string"},{"type":"module-and-worker:module","data":"module and worker"},{"type":"emit-chunk-sub-worker","data":{"module":"module and worker","msg1":"module1","msg2":"module2","msg3":"module3"}}]',
    )
  await expect
    .poll(() => page.textContent('.emit-chunk-dynamic-import-worker'))
    .toMatch('"A stringmodule1./"')
})

test('import.meta.glob in worker', async () => {
  await expect
    .poll(() => page.textContent('.importMetaGlob-worker'))
    .toMatch('["')
})

test('import.meta.glob with eager in worker', async () => {
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
