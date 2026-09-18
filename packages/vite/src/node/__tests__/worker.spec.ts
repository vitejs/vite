import type { Plugin } from 'rolldown'
import { describe, expect, test } from 'vitest'
import { build } from '..'

/**
 * main.js imports both `shared.js` directly and a `?worker` wrapping
 * `worker.js`, which itself also imports `shared.js` - the minimal shape
 * that exercises worker.shareChunks (fix #18068, fix #16719).
 */
function fixturePlugin(): Plugin {
  return {
    name: 'test',
    resolveId(id) {
      // `emitFile({ type: 'chunk', id })` re-resolves the *cleaned* (query
      // stripped) id, so this needs to accept that form too, not just the
      // raw specifiers below.
      const clean = id.replace(/^\0/, '')
      if (
        clean === 'main.js' ||
        clean === 'worker.js?worker' ||
        clean === 'worker.js' ||
        clean === 'shared.js'
      ) {
        return '\0' + clean
      }
    },
    load(id) {
      if (id === '\0main.js') {
        return `import { marker } from 'shared.js'
import Worker from 'worker.js?worker'
console.log(marker, Worker)`
      }
      // `vite:worker`'s own `load` hook claims the `?worker`-suffixed id and
      // generates the wrapper (`new Worker(...)`) code for it - this plugin
      // only needs to supply the worker's *own* source, at the plain,
      // unsuffixed id that `worker.shareChunks` emits as a chunk entry.
      if (id === '\0worker.js') {
        return `import { marker } from 'shared.js'
self.postMessage(marker)`
      }
      if (id === '\0shared.js') {
        return `export const marker = 'shared-marker'`
      }
    },
  }
}

describe('worker.shareChunks', () => {
  test('shares a chunk between the main build and a worker', async () => {
    const result = await build({
      root: import.meta.dirname,
      logLevel: 'silent',
      worker: { format: 'es' },
      build: { write: false, rollupOptions: { input: 'main.js' } },
      plugins: [fixturePlugin()],
    })

    const output = Array.isArray(result) ? result[0].output : result.output
    const chunks = output.filter((o) => o.type === 'chunk')
    const sharedChunk = chunks.find((c) => c.code.includes('shared-marker'))
    expect(
      sharedChunk,
      'shared.js should be extracted into its own chunk',
    ).toBeDefined()

    const worker = chunks.find((c) => /self\.postMessage/.test(c.code))
    const main = chunks.find((c) => c.code.includes('console.log'))
    expect(worker, 'worker chunk should exist').toBeDefined()
    expect(main, 'main chunk should exist').toBeDefined()
    // neither should have its own inlined copy of the shared marker string
    expect(worker!.code.includes('shared-marker')).toBe(false)
    expect(main!.code.includes('shared-marker')).toBe(false)
    // both should import the same physical shared chunk (imports are
    // relative, e.g. "./_shared-<hash>.js", so compare by basename)
    const sharedBasename = sharedChunk!.fileName.split('/').pop()!
    expect(worker!.code).toContain(sharedBasename)
    expect(main!.code).toContain(sharedBasename)
  })

  // Regression test for a real-world failure found via a project combining
  // worker.shareChunks with build.chunkImportMap: true. With that option,
  // Rolldown may write a chunk's static import specifiers as "preliminary"
  // names that only resolve to their real file through the import map it
  // generates into the main HTML document - which a worker script, running
  // in its own realm, never sees. Left unhandled, a shared worker chunk
  // ends up importing a file that doesn't exist from the worker's point of
  // view (though the same reference works fine for the main document).
  test('rewrites references that rely on the import map for a shared worker chunk', async () => {
    const result = await build({
      root: import.meta.dirname,
      logLevel: 'silent',
      worker: { format: 'es' },
      build: {
        write: false,
        chunkImportMap: true,
        rollupOptions: { input: 'main.js' },
      },
      plugins: [fixturePlugin()],
    })

    const output = Array.isArray(result) ? result[0].output : result.output
    const importMapAsset = output.find(
      (o) => o.type === 'asset' && o.fileName === 'importmap.json',
    )
    expect(
      importMapAsset,
      'build.chunkImportMap should still produce an import map for the main document',
    ).toBeDefined()

    const worker = output.find(
      (o) => o.type === 'chunk' && /self\.postMessage/.test(o.code),
    )
    expect(worker, 'worker chunk should exist').toBeDefined()
    // the worker's own import of the shared chunk must be a real, standalone
    // file name, not one that only the (worker-inaccessible) import map
    // knows how to resolve.
    const specifier = worker!.code.match(/from"(\.\/[^"]+)"/)?.[1]
    expect(
      specifier,
      'worker should statically import the shared chunk',
    ).toBeDefined()
    // specifiers are relative (e.g. "./_shared-<hash>.js"), so compare by
    // basename against the emitted chunks' fileNames (which include the
    // outDir-relative directory, e.g. "assets/_shared-<hash>.js")
    const referencedBasename = specifier!.split('/').pop()
    expect(
      output.some((o) => o.fileName.split('/').pop() === referencedBasename),
      `${specifier} should match a file actually emitted by this build`,
    ).toBe(true)
  })
})
