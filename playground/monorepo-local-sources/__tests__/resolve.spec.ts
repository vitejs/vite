import { describe, expect, test } from 'vitest'
import { page } from '~utils'

describe('local package - no source dir', () => {
  test('index import', async () => {
    expect(await page.textContent('#no-dir-index')).toMatch('index.ts')
  })

  test('deep import', async () => {
    expect(await page.textContent('#no-dir-deep')).toMatch('dir/deep.tsx')
  })
})

describe('local package - `src` dir', () => {
  test('index import', async () => {
    expect(await page.textContent('#src-dir-index')).toMatch('src/index.ts')
  })

  test('deep import', async () => {
    expect(await page.textContent('#src-dir-deep')).toMatch('src/dir/deep.tsx')
  })
})

describe('external package - uses exports', () => {
  test('index import', async () => {
    expect(await page.textContent('#not-local-index')).toMatch('build/index.js')
  })

  test('deep import', async () => {
    expect(await page.textContent('#not-local-deep')).toMatch(
      'build/dir/deep.js',
    )
  })
})
