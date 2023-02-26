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
    isBuild ? '/iife/assets/worker_asset-vite.svg' : '/iife/vite.svg',
    true,
  )
})

test('TS output', async () => {
  await untilUpdated(() => page.textContent('.pong-ts-output'), 'pong')
})

test('inlined', async () => {
  await untilUpdated(() => page.textContent('.pong-inline'), 'pong')
})

test('shared worker', async () => {
  await untilUpdated(() => page.textContent('.tick-count'), 'pong')
})

test('worker emitted and import.meta.url in nested worker (serve)', async () => {
  await untilUpdated(() => page.textContent('.nested-worker'), '/worker-nested')
  await untilUpdated(
    () => page.textContent('.nested-worker-module'),
    '/sub-worker',
  )
  await untilUpdated(
    () => page.textContent('.nested-worker-constructor'),
    '"type":"constructor"',
  )
})

describe.runIf(isBuild)('build', () => {
  // assert correct files
  test('inlined code generation', async () => {
    const assetsDir = path.resolve(testDir, 'dist/iife/assets')
    const files = fs.readdirSync(assetsDir)
    expect(files.length).toBe(16)
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
    expect(content).toMatch(`new Worker("/iife/assets`)
    expect(content).toMatch(`new SharedWorker("/iife/assets`)
    // inlined
    expect(content).toMatch(`(window.URL||window.webkitURL).createObjectURL`)
    expect(content).toMatch(`window.Blob`)
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
    () => page.textContent('.shared-worker-import-meta-url'),
    'A string',
  )
})

test('classic worker', async () => {
  await untilUpdated(() => page.textContent('.classic-worker'), 'A classic')
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
