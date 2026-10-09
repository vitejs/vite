import path from 'node:path'
import { build, resolveConfig } from 'vite'
import type { BuildOptions } from 'vite'
import { describe, expect, test } from 'vitest'
import legacy, { modulePreloadLinkRE } from '../index'
import type { Options } from '../types'

async function buildCss(
  options: Options = {},
  cssTarget?: BuildOptions['cssTarget'],
  root?: string,
  rootFromPlugin?: string,
) {
  const result = await build({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [
      legacy({ polyfills: false, externalSystemJS: true, ...options }),
      {
        name: 'test-project-root',
        config() {
          if (rootFromPlugin) return { root: rootFromPlugin }
        },
      },
      {
        name: 'test-css-input',
        resolveId(id) {
          if (id === 'entry.js' || id === 'style.css') return id
        },
        load(id) {
          if (id === 'entry.js') return 'import "style.css"'
          if (id === 'style.css') {
            return '.a { -webkit-user-select: none; user-select: none; position: -webkit-sticky; position: sticky; color: rgba(0, 0, 0, 0.5) }'
          }
        },
      },
    ],
    build: {
      write: false,
      cssMinify: 'lightningcss',
      cssTarget,
      rolldownOptions: { input: 'entry.js' },
    },
  })
  return (Array.isArray(result) ? result : [result])
    .flatMap((bundle) => bundle.output)
    .filter(
      (output) => output.type === 'asset' && output.fileName.endsWith('.css'),
    )
    .map((asset) => asset.source)
    .join('\n')
}

describe('CSS browser compatibility', () => {
  test('preserves Safari prefixes and avoids hexadecimal alpha colors by default', async () => {
    const css = await buildCss()
    expect(css).toContain('-webkit-user-select:none')
    expect(css).toContain('rgba(')
  })

  test.each<{ targets: Options['targets'] }>([
    { targets: 'Safari 9' },
    { targets: ['Safari 9'] },
    { targets: { safari: '9' } },
    { targets: { browsers: 'Safari 9', node: 'current' } },
  ])('preserves prefixes for legacy targets $targets', async ({ targets }) => {
    const css = await buildCss({ targets })
    expect(css).toContain('position:-webkit-sticky')
    expect(css).toContain('-webkit-user-select:none')
    expect(css).toContain('rgba(')
  })

  test('loads Browserslist after later plugins set the project root', async () => {
    const css = await buildCss(
      {},
      undefined,
      undefined,
      path.resolve(import.meta.dirname, 'fixtures/css-targets'),
    )
    expect(css).toContain('position:-webkit-sticky')
  })

  test.each<{ targets: Options['targets'] }>([
    { targets: { safari: 'tp' } },
    { targets: { opera_mobile: '12' } },
  ])('accepts Babel target forms $targets', async ({ targets }) => {
    const css = await buildCss({ targets })
    expect(css).toContain('-webkit-user-select:none')
  })

  test('loads legacy CSS targets from the project Browserslist configuration', async () => {
    const css = await buildCss(
      {},
      undefined,
      path.resolve(import.meta.dirname, 'fixtures/css-targets'),
    )
    expect(css).toContain('position:-webkit-sticky')
  })

  test('does not apply legacy CSS targets when legacy chunks are disabled', async () => {
    const css = await buildCss({
      targets: 'Safari 9',
      renderLegacyChunks: false,
    })
    expect(css).not.toContain('position:-webkit-sticky')
  })

  test('respects an explicit CSS target', async () => {
    const css = await buildCss({ targets: 'Safari 9' }, 'chrome120')
    expect(css).not.toContain('-webkit-')
    expect(css).toContain('#00000080')
  })

  test('respects CSS targets set by later configResolved hooks', async () => {
    const config = await resolveConfig(
      {
        configFile: false,
        logLevel: 'silent',
        plugins: [
          legacy(),
          {
            name: 'test-css-override',
            enforce: 'post',
            configResolved(config) {
              config.build.cssTarget = 'chrome120'
              config.environments.client.build.cssTarget = 'chrome120'
            },
          },
        ],
      },
      'build',
    )
    expect(config.build.cssTarget).toBe('chrome120')
    expect(config.environments.client.build.cssTarget).toBe('chrome120')
  })
})

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
