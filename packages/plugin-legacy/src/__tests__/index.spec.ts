import { describe, expect, test } from 'vitest'
import { modulePreloadLinkRE } from '../index'

describe('modulePreloadLinkRE', () => {
  const matches: Array<[string, string]> = [
    ['rel first', '<link rel="modulepreload" crossorigin href="/assets/x.js">'],
    [
      'rel after other attributes',
      '<link href="/assets/x.js" rel="modulepreload">',
    ],
    ['rel only', '<link rel="modulepreload">'],
    ['self-closing', '<link rel="modulepreload"/>'],
    [
      'greater-than in an attribute before rel',
      '<link title="a > b" rel="modulepreload" href="/assets/x.js">',
    ],
    [
      'greater-than in an attribute after rel',
      "<link rel='modulepreload' title='a > b' href='/assets/x.js'>",
    ],
    ['self-closing with space', '<link rel="modulepreload" />'],
    ['single quotes', "<link rel='modulepreload' href='/assets/x.js'>"],
    [
      'attributes across multiple lines',
      '<link\n  rel="modulepreload"\n  href="/assets/x.js"\n>',
    ],
  ]

  for (const [name, html] of matches) {
    test(`matches: ${name}`, () => {
      expect(html.replace(modulePreloadLinkRE, '')).toBe('')
    })
  }

  const nonMatches: Array<[string, string]> = [
    ['tag name with suffix', '<linkfoo rel="modulepreload">'],
    ['custom element with hyphen', '<link-preview rel="modulepreload">'],
    ['bare link tag', '<link>'],
    ['stylesheet link', '<link rel="stylesheet" href="/assets/x.css">'],
    ['preload (not modulepreload)', '<link rel="preload" href="/assets/x.js">'],
    [
      'attribute name ending in rel',
      '<link xrel="modulepreload" href="/assets/x.js">',
    ],
    ['mismatched quotes', `<link rel="modulepreload'>`],
    [
      'rel text inside a single-quoted attribute',
      `<link rel="stylesheet" href="/style.css" title='Example: rel="modulepreload"'>`,
    ],
    [
      'rel text inside a double-quoted attribute',
      `<link title="Example: rel='modulepreload'" rel="stylesheet" href="/style.css">`,
    ],
  ]

  for (const [name, html] of nonMatches) {
    test(`does not match: ${name}`, () => {
      expect(html.replace(modulePreloadLinkRE, '')).toBe(html)
    })
  }

  test('preserves surrounding HTML when removing multiple links', () => {
    const stylesheet = `<link rel="stylesheet" title='Example: rel="modulepreload"' href="/style.css">`
    const html = `${stylesheet}<link rel="modulepreload" title="a > b" href="/a.js"><link title='c > d' rel="modulepreload" href="/b.js"><main>content</main>`
    expect(html.replace(modulePreloadLinkRE, '')).toBe(
      `${stylesheet}<main>content</main>`,
    )
  })
})
