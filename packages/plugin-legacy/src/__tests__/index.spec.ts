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
  ]

  for (const [name, html] of nonMatches) {
    test(`does not match: ${name}`, () => {
      expect(html.replace(modulePreloadLinkRE, '')).toBe(html)
    })
  }
})
