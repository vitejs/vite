import { describe, expect, test } from 'vitest'
import { browserLogs, bundledDevTodo, isBuild, page } from '~utils'

test('importmap', () => {
  expect(browserLogs).not.toContain(
    'An import map is added after module script load was triggered.',
  )
})

test('should have default exports', async () => {
  expect(await page.textContent('#imported-slash5-exists')).toBe('true')
  expect(await page.textContent('#imported-slash3-exists')).toBe('true')
  expect(await page.textContent('#required-slash3-exists')).toBe('true')
})

test('resolves plugin external static imports through import maps', async () => {
  for (const selector of [
    '#plugin-external-static',
    '#plugin-external-rewritten-static',
  ]) {
    await expect
      .poll(() => page.textContent(selector))
      .toBe('loaded through import map')
  }
})

test(
  'resolves plugin external dynamic imports through import maps',
  bundledDevTodo(
    'bundled dev looks up external dynamic imports in its module registry instead of using native import() to resolve them through import maps',
  ),
  async () => {
    for (const selector of [
      '#plugin-external-dynamic',
      '#plugin-external-rewritten-dynamic',
    ]) {
      await expect
        .poll(() => page.textContent(selector))
        .toBe('loaded through import map')
    }
  },
)

describe.runIf(isBuild)('build', () => {
  test('should externalize imported packages', async () => {
    // If `vue` is successfully externalized, the page should use the version from the import map
    expect(await page.textContent('#imported-vue-version')).toBe('3.4.38')
  })

  test('should externalize required packages', async () => {
    // If `vue` is successfully externalized, the page should use the version from the import map
    expect(await page.textContent('#required-vue-version')).toBe('3.4.38')
  })
})
