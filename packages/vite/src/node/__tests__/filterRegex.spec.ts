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

  test('assetImportMetaUrlFilterRE completes in reasonable time on large files', () => {
    const start = performance.now()
    const result = assetImportMetaUrlFilterRE.test(largeCode)
    const duration = performance.now() - start

    expect(result).toBe(false)
    expect(duration).toBeLessThan(1000)
  })

  test('workerImportMetaUrlRE completes in reasonable time on large files', () => {
    const start = performance.now()
    const result = workerImportMetaUrlRE.test(largeCode)
    const duration = performance.now() - start

    expect(result).toBe(false)
    expect(duration).toBeLessThan(1000)
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
