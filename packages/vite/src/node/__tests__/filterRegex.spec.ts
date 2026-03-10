import { describe, expect, test } from 'vitest'
import { assetImportMetaUrlFilterRE } from '../plugins/assetImportMetaUrl'
import { workerImportMetaUrlRE } from '../plugins/workerImportMetaUrl'

describe('filter regexes do not cause catastrophic backtracking', () => {
  const largeCode =
    `new URL('https://example.com');\n`.repeat(200) +
    `var a = 1;\n`.repeat(200_000)

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
