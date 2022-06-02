import fs from 'fs'
import path from 'path'
import type { Page } from 'playwright-chromium'
import { test } from 'vitest'
import { isBuild, page, testDir, untilUpdated } from '~utils'

test('normal', async () => {
  await page.click('.ping')
  await untilUpdated(() => page.textContent('.pong'), 'pong')
  await untilUpdated(
    () => page.textContent('.mode'),
    process.env.NODE_ENV // match workerImport.js
  )
  await untilUpdated(
    () => page.textContent('.bundle-with-plugin'),
    'worker bundle with plugin success!'
  )
})

test('TS output', async () => {
  await page.click('.ping-ts-output')
  await untilUpdated(() => page.textContent('.pong-ts-output'), 'pong')
})

test('inlined', async () => {
  await page.click('.ping-inline')
  await untilUpdated(() => page.textContent('.pong-inline'), 'pong')
})

const waitSharedWorkerTick = (
  (resolvedSharedWorkerCount: number) => async (page: Page) => {
    await untilUpdated(async () => {
      const count = await page.textContent('.tick-count')
      // ignore the initial 0
      return count === '1' ? 'page loaded' : ''
    }, 'page loaded')
    // test.concurrent sequential is not guaranteed
    // force page to wait to ensure two pages overlap in time
    resolvedSharedWorkerCount++
    if (resolvedSharedWorkerCount < 2) return

    await untilUpdated(() => {
      return resolvedSharedWorkerCount === 2 ? 'all pages loaded' : ''
    }, 'all pages loaded')
  }
)(0)

test.each([[true], [false]])('shared worker', async (doTick) => {
  if (doTick) {
    await page.click('.tick-shared')
  }
  await waitSharedWorkerTick(page)
})

test('worker emitted and import.meta.url in nested worker (serve)', async () => {
  expect(await page.textContent('.nested-worker')).toMatch('/worker-nested')
  expect(await page.textContent('.nested-worker-module')).toMatch('/sub-worker')
  expect(await page.textContent('.nested-worker-constructor')).toMatch(
    '"type":"constructor"'
  )
})

describe.runIf(isBuild)('build', () => {
  // assert correct files
  test('inlined code generation', async () => {
    const assetsDir = path.resolve(testDir, 'dist/iife/assets')
    const files = fs.readdirSync(assetsDir)
    expect(files.length).toBe(15)
    const index = files.find((f) => f.includes('main-module'))
    const content = fs.readFileSync(path.resolve(assetsDir, index), 'utf-8')
    const worker = files.find((f) => f.includes('my-worker'))
    const workerContent = fs.readFileSync(
      path.resolve(assetsDir, worker),
      'utf-8'
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
    expect(await page.textContent('.nested-worker-module')).toMatch(
      '"type":"module"'
    )
    expect(await page.textContent('.nested-worker-constructor')).toMatch(
      '"type":"constructor"'
    )
  })
})

test('module worker', async () => {
  expect(await page.textContent('.shared-worker-import-meta-url')).toMatch(
    'A string'
  )
})

test('classic worker', async () => {
  expect(await page.textContent('.classic-worker')).toMatch('A classic')
  expect(await page.textContent('.classic-shared-worker')).toMatch('A classic')
})

test('url query worker', async () => {
  expect(await page.textContent('.simple-worker-url')).toMatch(
    'Hello from simple worker!'
  )
})

test('import.meta.glob eager in worker', async () => {
  expect(await page.textContent('.importMetaGlobEager-worker')).toMatch('["')
})
