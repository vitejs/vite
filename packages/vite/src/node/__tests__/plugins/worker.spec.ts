import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import type { OutputChunk, RolldownOutput } from 'rolldown'
import { build } from '../../build'

const fixturesDir = resolve(import.meta.dirname, '..', 'packages')

describe('worker', () => {
  // https://github.com/vitejs/vite/issues/XXXXX
  // bundleWorkerEntry() reads config.build.minify from the caller environment
  // instead of the worker environment. SSR builds have minify: false while
  // client builds have minify: 'oxc', producing different content hashes for
  // the same ?worker&url import. SSR renders HTML with server hashes, but only
  // client files are served → 404.
  test('?worker&url should produce the same hash in client and SSR builds', async () => {
    const root = resolve(fixturesDir, 'worker-url-project')

    const clientResult = (await build({
      root,
      logLevel: 'silent',
      build: {
        write: false,
      },
    })) as RolldownOutput

    const ssrResult = (await build({
      root,
      logLevel: 'silent',
      build: {
        write: false,
        ssr: resolve(root, 'ssr-entry.js'),
      },
    })) as RolldownOutput

    // Extract the worker URL from both builds.
    // The entry chunk will contain the worker asset URL as a string.
    const clientEntry = clientResult.output.find(
      (o): o is OutputChunk => o.type === 'chunk' && o.isEntry,
    )!
    const ssrEntry = ssrResult.output.find(
      (o): o is OutputChunk => o.type === 'chunk' && o.isEntry,
    )!

    // Worker filenames follow the pattern: assets/worker-HASH.js
    const workerUrlPattern = /assets\/worker-[\w-]+\.js/g
    const clientWorkerUrls = clientEntry.code.match(workerUrlPattern) ?? []
    const ssrWorkerUrls = ssrEntry.code.match(workerUrlPattern) ?? []

    expect(clientWorkerUrls.length).toBeGreaterThan(0)
    expect(ssrWorkerUrls.length).toBeGreaterThan(0)
    expect(ssrWorkerUrls).toEqual(clientWorkerUrls)
  })
})
