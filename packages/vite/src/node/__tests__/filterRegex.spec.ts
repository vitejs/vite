import { describe, expect, test } from 'vitest'
import { assetImportMetaUrlRE } from '../plugins/assetImportMetaUrl'
import { workerImportMetaUrlRE } from '../plugins/workerImportMetaUrl'

describe('filter regexes do not cause catastrophic backtracking', () => {
  const largeCode =
    `new URL('https://example.com');\n`.repeat(200) +
    `var a = 1;\n`.repeat(200_000)

  test('assetImportMetaUrlRE completes without backtracking on large files', () => {
    assetImportMetaUrlRE.lastIndex = 0
    expect(assetImportMetaUrlRE.test(largeCode)).toBe(false)
  })

  test('workerImportMetaUrlRE completes without backtracking on large files', () => {
    workerImportMetaUrlRE.lastIndex = 0
    expect(workerImportMetaUrlRE.test(largeCode)).toBe(false)
  })

  test('assetImportMetaUrlRE still matches valid patterns', () => {
    assetImportMetaUrlRE.lastIndex = 0
    expect(
      assetImportMetaUrlRE.test(`new URL('./asset.png', import.meta.url)`),
    ).toBe(true)
  })

  test('workerImportMetaUrlRE still matches valid patterns', () => {
    workerImportMetaUrlRE.lastIndex = 0
    expect(
      workerImportMetaUrlRE.test(
        `new Worker(new URL('./worker.js', import.meta.url))`,
      ),
    ).toBe(true)
  })
})
