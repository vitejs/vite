import type { Plugin } from 'rolldown'
import { describe, expect, test } from 'vitest'
import { build } from '..'

/**
 * main-a.js and main-b.js both statically import shared.js, so a normal
 * production build splits it into its own chunk referenced from both
 * entries - the minimal shape needed to exercise cross-chunk references
 * (including, with `chunkImportMap: true`, references that only resolve
 * through the generated import map) without any worker involved.
 */
function fixturePlugin(): Plugin {
  return {
    name: 'test',
    resolveId(id) {
      if (id === 'main-a.js' || id === 'main-b.js' || id === 'shared.js') {
        return '\0' + id
      }
    },
    load(id) {
      if (id === '\0main-a.js') {
        return `import { marker } from 'shared.js'
console.log('entry-a', marker)`
      }
      if (id === '\0main-b.js') {
        return `import { marker } from 'shared.js'
console.log('entry-b', marker)`
      }
      if (id === '\0shared.js') {
        return `export const marker = 'shared-marker'`
      }
    },
  }
}

/**
 * Corrupts the emitted chunk whose code contains `marker` into a broken
 * relative reference, in `renderChunk` (which always completes, across
 * every plugin, before any `generateBundle` hook runs - including
 * `vite:check-output-references`).
 */
function corruptReferencePlugin(marker: string): Plugin {
  return {
    name: 'corrupt-chunk-reference',
    renderChunk(code) {
      if (!code.includes(marker)) return null
      // the referenced file name may still be an unresolved internal hash
      // placeholder at this point (not yet the plain string seen in the
      // final output), so match broadly rather than assuming a
      // `[\w.-]+`-safe file name is already there.
      const corrupted = code.replace(
        /from\s*(["'])(\.\/[^"']+)\1/,
        (_, quote) => `from ${quote}./this-file-does-not-exist.js${quote}`,
      )
      return corrupted === code ? null : { code: corrupted, map: null }
    },
  }
}

function outputsOf(result: Awaited<ReturnType<typeof build>>) {
  return Array.isArray(result) ? result.flatMap((r) => r.output) : result.output
}

describe('vite:check-output-references', () => {
  test('does not false-positive on an ordinary multi-chunk build', async () => {
    const result = await build({
      root: import.meta.dirname,
      logLevel: 'silent',
      build: {
        write: false,
        rollupOptions: { input: ['main-a.js', 'main-b.js'] },
      },
      plugins: [fixturePlugin()],
    })

    const shared = outputsOf(result).find(
      (o) => o.type === 'chunk' && o.code.includes('shared-marker'),
    )
    expect(
      shared,
      'shared.js should be extracted into its own chunk',
    ).toBeDefined()
  })

  test('fails the build if a chunk ends up with a broken relative reference', async () => {
    const buildPromise = build({
      root: import.meta.dirname,
      logLevel: 'silent',
      build: {
        write: false,
        rollupOptions: { input: ['main-a.js', 'main-b.js'] },
      },
      plugins: [fixturePlugin(), corruptReferencePlugin('entry-a')],
    })

    await expect(buildPromise).rejects.toThrow(
      /this-file-does-not-exist\.js.*doesn't match any file this build actually emitted/s,
    )
  })

  // Regression test for the concern raised in review: `build.chunkImportMap`
  // may legitimately leave a chunk's static import specifiers as
  // "preliminary" names only resolvable through the generated import map -
  // valid for any ordinary chunk, unlike the worker realm this safety net
  // used to be scoped to. Without the import-map fallback, this would
  // false-positive on every chunkImportMap-enabled build.
  test('does not false-positive when a reference only resolves through the chunk import map', async () => {
    const result = await build({
      root: import.meta.dirname,
      logLevel: 'silent',
      build: {
        write: false,
        chunkImportMap: true,
        rollupOptions: { input: ['main-a.js', 'main-b.js'] },
      },
      plugins: [fixturePlugin()],
    })

    const outputs = outputsOf(result)
    expect(
      outputs.some(
        (o) => o.type === 'asset' && o.fileName === 'importmap.json',
      ),
      'build.chunkImportMap should still produce an import map',
    ).toBe(true)
    const shared = outputs.find(
      (o) => o.type === 'chunk' && o.code.includes('shared-marker'),
    )
    expect(
      shared,
      'shared.js should be extracted into its own chunk',
    ).toBeDefined()
  })

  test('still fails on a genuinely broken reference when the chunk import map is enabled', async () => {
    const buildPromise = build({
      root: import.meta.dirname,
      logLevel: 'silent',
      build: {
        write: false,
        chunkImportMap: true,
        rollupOptions: { input: ['main-a.js', 'main-b.js'] },
      },
      plugins: [fixturePlugin(), corruptReferencePlugin('entry-a')],
    })

    await expect(buildPromise).rejects.toThrow(
      /this-file-does-not-exist\.js.*doesn't match any file this build actually emitted/s,
    )
  })
})
