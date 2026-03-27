import { describe, expect, test } from 'vitest'
import {
  resolveDocSearchNavigationTarget,
  resolveDocSearchResultUrl,
} from '../docsearchResultUrl'

describe('resolveDocSearchNavigationTarget', () => {
  test('normalizes same-origin result urls for client-side routing', () => {
    expect(
      resolveDocSearchNavigationTarget(
        'https://vite.dev/guide/why.html?foo=bar#intro',
        'https://vite.dev',
        true,
      ),
    ).toEqual({
      external: false,
      url: '/guide/why?foo=bar#intro',
    })
  })

  test('preserves cross-origin result urls for old docs versions', () => {
    expect(
      resolveDocSearchNavigationTarget(
        'https://v7.vite.dev/guide/rolldown.html#usage',
        'https://vite.dev',
        true,
      ),
    ).toEqual({
      external: true,
      url: 'https://v7.vite.dev/guide/rolldown.html#usage',
    })
  })
})

describe('resolveDocSearchResultUrl', () => {
  test('keeps .html urls when cleanUrls is disabled', () => {
    expect(
      resolveDocSearchResultUrl(
        '/guide/why.html?foo=bar#intro',
        'https://vite.dev',
        false,
      ),
    ).toBe('/guide/why.html?foo=bar#intro')
  })
})
