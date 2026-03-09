import { describe, expect, test } from 'vitest'
import { assetImportMetaUrlFilterRE } from '../plugins/assetImportMetaUrl'
import { workerImportMetaUrlRE } from '../plugins/workerImportMetaUrl'

// These are the filter.code regexes used in the transform hooks.
// They must not cause catastrophic backtracking on large files.
// See https://github.com/vitejs/vite/issues/21696

describe('filter regexes do not cause catastrophic backtracking', () => {
  // Large file where `new URL(...)` appears many times but `import.meta.url`
  // is absent. With the old /s + .+ pattern, each `new URL` occurrence would
  // cause the regex engine to consume the rest of the file before backtracking.
  const largeCode =
    `new URL('https://example.com');\n`.repeat(200) +
    `var a = 1;\n`.repeat(200_000)

  // These tests rely on the default test timeout (5s) to catch backtracking.
  // The old regexes took >1s on this input; the new ones complete in ~3ms.
  test('assetImportMetaUrlFilterRE completes without backtracking on large files', () => {
    expect(assetImportMetaUrlFilterRE.test(largeCode)).toBe(false)
  })

  test('workerImportMetaUrlRE completes without backtracking on large files', () => {
    expect(workerImportMetaUrlRE.test(largeCode)).toBe(false)
  })

  test('assetImportMetaUrlFilterRE still matches valid patterns', () => {
    expect(
      assetImportMetaUrlFilterRE.test(
        `new URL('./asset.png', import.meta.url)`,
      ),
    ).toBe(true)
  })

  test('workerImportMetaUrlRE still matches valid patterns', () => {
    expect(
      workerImportMetaUrlRE.test(
        `new Worker(new URL('./worker.js', import.meta.url))`,
      ),
    ).toBe(true)
  })
})
