import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { isBuild, page, testDir } from '~utils'

// https://github.com/vitejs/vite/issues/18068 (share chunks between ES
// module workers) and https://github.com/vitejs/vite/issues/16719 (share
// chunks between the main build and a worker), covering `worker.shareChunks`
// (default: true for `worker.format: 'es'`).

test('main thread and workers all see the shared module', async () => {
  await expect
    .poll(() => page.textContent('.shared-chunks-main'))
    .toMatch('["shared-chunk-marker",false]')
  await expect
    .poll(() => page.textContent('.shared-chunks-worker-a'))
    .toMatch('["worker-a","shared-chunk-marker",true]')
  await expect
    .poll(() => page.textContent('.shared-chunks-worker-b'))
    .toMatch('["worker-b","shared-chunk-marker",true]')
})

test('inline workers keep working (shareChunkOnInline defaults to false)', async () => {
  await expect
    .poll(() => page.textContent('.shared-chunks-worker-inline'))
    .toMatch('["worker-a","shared-chunk-marker",true]')
})

describe.runIf(isBuild)('build', () => {
  function assetsDir(): string {
    return path.resolve(testDir, 'dist/shared-chunks/assets')
  }

  function readAsset(fileNamePart: string): { file: string; content: string } {
    const assets = assetsDir()
    const files = fs.readdirSync(assets)
    const file = files.find(
      (f) => f.includes(fileNamePart) && f.endsWith('.js'),
    )
    expect(
      file,
      `no file matching "${fileNamePart}" in ${assets}`,
    ).toBeDefined()
    return {
      file: file!,
      content: fs.readFileSync(path.resolve(assets, file!), 'utf-8'),
    }
  }

  test('worker-a and worker-b share a single common chunk', () => {
    const workerA = readAsset('worker-a')
    const workerB = readAsset('worker-b')
    const main = readAsset('main-shared-chunks')

    // neither worker should inline the shared module's code - each should
    // import it instead. (`main` legitimately contains a second, isolated
    // copy too, embedded as the `?worker&inline` variant's self-contained
    // blob - see the "inline worker" tests below.)
    for (const { file, content } of [workerA, workerB]) {
      expect(
        content,
        `${file} should not inline the shared module`,
      ).not.toMatch(/=>typeof \w==`?boolean`?/)
    }

    // extract the common.js chunk each references (assets/common-<hash>.js)
    const commonRefRE = /["'](\.?\/?(?:assets\/)?common-[\w-]+\.js)["']/
    const workerACommon = workerA.content.match(commonRefRE)?.[1]
    const workerBCommon = workerB.content.match(commonRefRE)?.[1]
    const mainCommon = main.content.match(commonRefRE)?.[1]
    expect(
      workerACommon,
      `${workerA.file} should import the shared chunk`,
    ).toBeDefined()
    expect(
      workerBCommon,
      `${workerB.file} should import the shared chunk`,
    ).toBeDefined()
    expect(
      mainCommon,
      `${main.file} should import the shared chunk`,
    ).toBeDefined()

    // resolve each reference to its basename - they must all be the exact
    // same physical file (real deduplication, not just "a" chunk each).
    const basename = (p: string) => p.split('/').pop()
    expect(basename(workerACommon!)).toBe(basename(workerBCommon!))
    expect(basename(workerACommon!)).toBe(basename(mainCommon!))
  })

  // Regression guard: an earlier draft of this feature emitted a worker
  // referencing a chunk URL whose hash didn't match the file actually
  // written to disk (e.g. importing "worker-abcde.js" when the real file on
  // disk was "worker-fghijk.js"), silently producing a broken build. Verify
  // every reference embedded in every emitted JS file in this build
  // actually resolves to a file that exists.
  test('every referenced chunk/asset file actually exists on disk', () => {
    const assets = assetsDir()
    const files = fs.readdirSync(assets).filter((f) => f.endsWith('.js'))
    const existing = new Set(files)
    // matches both static import specifiers (`from "./x-hash.js"`) and
    // runtime URL strings (`new Worker("/shared-chunks/assets/x-hash.js")`)
    const referenceRE =
      /["'](?:\.\/|\/shared-chunks\/assets\/)([\w.-]+\.js)["']/g

    for (const file of files) {
      const content = fs.readFileSync(path.resolve(assets, file), 'utf-8')
      for (const match of content.matchAll(referenceRE)) {
        const referenced = match[1]
        expect(
          existing.has(referenced),
          `${file} references "${referenced}", which was not emitted to ${assets} (found: ${files.join(', ')})`,
        ).toBe(true)
      }
    }
  })

  test('dead code elimination still works with shareChunks enabled', () => {
    const files = fs.readdirSync(assetsDir())

    // same fixtures/assertions as the `es` variant's DCE test, but exercised
    // here under the shareChunks: true default instead of shareChunks: false.
    expect(files.some((f) => f.includes('dce-test-worker'))).toBe(false)
    expect(files.some((f) => f.includes('dce-test-nested-worker'))).toBe(false)
    expect(files.some((f) => f.includes('dce-test-live-worker'))).toBe(true)
    expect(files.some((f) => f.includes('dce-test-live-nested-worker'))).toBe(
      false,
    )
  })

  test('inline worker is not emitted as a separate chunk', () => {
    const files = fs.readdirSync(assetsDir())
    // `worker-a.js?worker&inline` must stay self-contained: shareChunkOnInline
    // defaults to false, so it should go through the normal blob/data-URI
    // inline path, not get its own emitted file the way worker-a.js?worker
    // (non-inline) does.
    const workerAFiles = files.filter(
      (f) => f.includes('worker-a') && f.endsWith('.js'),
    )
    expect(workerAFiles.length).toBe(1)
  })
})
