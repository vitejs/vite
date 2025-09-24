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
    .toMatch(
      isBuild
        ? /\/es\/assets\/worker_asset-vite-[\w-]{8}\.svg/
        : '/es/vite.svg',
    )
  await expect.poll(() => page.textContent('.dep-cjs')).toMatch('[cjs ok]')
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

test('import meta url', async () => {
  await expect
    .poll(() => page.textContent('.pong-inline-url'))
    .toMatch(/^(blob|http):/)
})

test('unicode inlined', async () => {
  await expect
    .poll(() => page.textContent('.pong-inline-unicode'))
    .toMatch('•pong•')
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

test('deeply nested workers', async () => {
  await expect
    .poll(() => page.textContent('.deeply-nested-worker'))
    .toMatch(/Hello\sfrom\sroot.*\/es\/.+deeply-nested-worker\.js/)
  await expect
    .poll(() => page.textContent('.deeply-nested-second-worker'))
    .toMatch(/Hello\sfrom\ssecond.*\/es\/.+second-worker\.js/)
  await expect
    .poll(() => page.textContent('.deeply-nested-third-worker'))
    .toMatch(/Hello\sfrom\sthird.*\/es\/.+third-worker\.js/)
})

describe.runIf(isBuild)('build', () => {
  // assert correct files
  test('inlined code generation', async () => {
    const assetsDir = path.resolve(testDir, 'dist/es/assets')
    const files = fs.readdirSync(assetsDir)
    expect(files.length).toBe(36)
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
      `return new SharedWorker("data:text/javascript;charset=utf-8,"+`,
    )
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
    .poll(() => page.textContent('.worker-import-meta-url'))
    .toMatch('A string')
  await expect
    .poll(() => page.textContent('.worker-import-meta-url-resolve'))
    .toMatch('A string')
  await expect
    .poll(() => page.textContent('.worker-import-meta-url-without-extension'))
    .toMatch('A string')
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

test('emit chunk', async () => {
  await expect
    .poll(() => page.textContent('.emit-chunk-worker'))
    .toMatch(
      '["A string",{"type":"emit-chunk-sub-worker","data":"A string"},{"type":"module-and-worker:worker","data":"A string"},{"type":"module-and-worker:module","data":"module and worker"},{"type":"emit-chunk-sub-worker","data":{"module":"module and worker","msg1":"module1","msg2":"module2","msg3":"module3"}}]',
    )
  await expect
    .poll(() => page.textContent('.emit-chunk-dynamic-import-worker'))
    .toMatch('"A stringmodule1/es/"')
})

test('url query worker', async () => {
  await expect
    .poll(() => page.textContent('.simple-worker-url'))
    .toMatch('Hello from simple worker!')
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
    .toMatch('pong: main\npong: nested\n')
})

test('self reference url worker', async () => {
  await expect
    .poll(() => page.textContent('.self-reference-url-worker'))
    .toMatch('pong: main\npong: nested\n')
})
