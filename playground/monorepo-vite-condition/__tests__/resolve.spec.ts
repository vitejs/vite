import { describe, expect, test } from 'vitest'
import { page } from '~utils'

describe('local (linked into node modules via workspace:)', () => {
  test('main - default import', async () => {
    expect(await page.textContent('#main-default')).toMatch('main.ts')
  })

  test('exports - default import', async () => {
    expect(await page.textContent('#exports-default')).toMatch('index.ts')
  })

  test('exports - deep import', async () => {
    expect(await page.textContent('#exports-deep')).toMatch('dir/deep.tsx')
  })
})

describe('internal (linked into node modules via link:)', () => {
  test('uses `vite` export', async () => {
    expect(await page.textContent('#exports-internal')).toMatch('src/index.ts')
  })

  test('uses `vite` entry point', async () => {
    expect(await page.textContent('#main-internal')).toMatch('src/main.ts')
  })
})

describe('external (not a local package, in node modules via file:)', () => {
  test('uses `module` export', async () => {
    expect(await page.textContent('#exports-external')).toMatch(
      'build/index.js',
    )
  })

  test('uses `main` entry point', async () => {
    expect(await page.textContent('#main-external')).toMatch('build/main.js')
  })
})
