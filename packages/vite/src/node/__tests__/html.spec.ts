import { describe, expect, test } from 'vitest'
import type { OutputBundle, OutputChunk } from 'rolldown'
import { resolveConfig } from '../config'
import {
  getCssFilesForChunk,
  injectCspNonceMetaTagHook,
  injectNonceAttributeTagHook,
} from '../plugins/html'

function createChunk(
  fileName: string,
  imports: string[],
  importedCss: string[],
): OutputChunk {
  return {
    type: 'chunk',
    fileName,
    imports,
    viteMetadata: { importedCss: new Set(importedCss) },
  } as unknown as OutputChunk
}

function createBundle(...chunks: OutputChunk[]): OutputBundle {
  const bundle: Record<string, OutputChunk> = {}
  for (const chunk of chunks) {
    bundle[chunk.fileName] = chunk
  }
  return bundle as unknown as OutputBundle
}

async function resolveHtmlConfig(
  cspNonce?: string | { script: string; style: string },
) {
  return resolveConfig(
    {
      configFile: false,
      html: {
        cspNonce,
      },
    },
    'serve',
  )
}

describe('getCssFilesForChunk', () => {
  test('single chunk with own CSS', () => {
    const chunk = createChunk('entry.js', [], ['style.css'])
    const bundle = createBundle(chunk)
    const cache = new Map<OutputChunk, string[]>()
    expect(getCssFilesForChunk(chunk, bundle, cache)).toStrictEqual([
      'style.css',
    ])
  })

  test('chunk with no CSS returns empty array', () => {
    const chunk = createChunk('entry.js', [], [])
    const bundle = createBundle(chunk)
    const cache = new Map<OutputChunk, string[]>()
    expect(getCssFilesForChunk(chunk, bundle, cache)).toStrictEqual([])
  })

  test('imported chunk CSS comes before own CSS', () => {
    const dep = createChunk('dep.js', [], ['dep.css'])
    const entry = createChunk('entry.js', ['dep.js'], ['entry.css'])
    const bundle = createBundle(entry, dep)
    const cache = new Map<OutputChunk, string[]>()
    expect(getCssFilesForChunk(entry, bundle, cache)).toStrictEqual([
      'dep.css',
      'entry.css',
    ])
  })

  test('deep import chain preserves order', () => {
    const c = createChunk('c.js', [], ['c.css'])
    const b = createChunk('b.js', ['c.js'], ['b.css'])
    const a = createChunk('a.js', ['b.js'], ['a.css'])
    const bundle = createBundle(a, b, c)
    const cache = new Map<OutputChunk, string[]>()
    expect(getCssFilesForChunk(a, bundle, cache)).toStrictEqual([
      'c.css',
      'b.css',
      'a.css',
    ])
  })

  test('cache is populated and used on second call', () => {
    const dep = createChunk('dep.js', [], ['dep.css'])
    const entry = createChunk('entry.js', ['dep.js'], ['entry.css'])
    const bundle = createBundle(entry, dep)
    const cache = new Map<OutputChunk, string[]>()

    const result = getCssFilesForChunk(entry, bundle, cache)
    expect(result).toStrictEqual(['dep.css', 'entry.css'])
    expect(cache.has(dep)).toBe(true)
    expect(cache.has(entry)).toBe(true)

    expect(getCssFilesForChunk(entry, bundle, cache)).toStrictEqual(result)
  })

  test('shared dependency CSS is output for each entry point', () => {
    const shared = createChunk('shared.js', [], ['shared.css'])
    const entryA = createChunk('a.js', ['shared.js'], ['a.css'])
    const entryB = createChunk('b.js', ['shared.js'], ['b.css'])
    const bundle = createBundle(entryA, entryB, shared)
    const cache = new Map<OutputChunk, string[]>()
    expect(getCssFilesForChunk(entryA, bundle, cache)).toStrictEqual([
      'shared.css',
      'a.css',
    ])
    expect(getCssFilesForChunk(entryB, bundle, cache)).toStrictEqual([
      'shared.css',
      'b.css',
    ])
  })

  test('diamond dependency deduplicates CSS and preserves order', () => {
    //   A
    //  / \
    // B   C
    //  \ /
    //   D
    const d = createChunk('d.js', [], ['d.css'])
    const b = createChunk('b.js', ['d.js'], ['b.css'])
    const c = createChunk('c.js', ['d.js'], ['c.css'])
    const a = createChunk('a.js', ['b.js', 'c.js'], ['a.css'])
    const bundle = createBundle(a, b, c, d)
    const cache = new Map<OutputChunk, string[]>()
    expect(getCssFilesForChunk(a, bundle, cache)).toStrictEqual([
      'd.css',
      'b.css',
      'c.css',
      'a.css',
    ])
  })

  test('multiple shared dependencies with different CSS', () => {
    const shared1 = createChunk('shared1.js', [], ['shared1.css'])
    const shared2 = createChunk('shared2.js', [], ['shared2.css'])
    const entryA = createChunk('a.js', ['shared1.js', 'shared2.js'], ['a.css'])
    const entryB = createChunk('b.js', ['shared2.js', 'shared1.js'], ['b.css'])
    const bundle = createBundle(entryA, entryB, shared1, shared2)
    const cache = new Map<OutputChunk, string[]>()
    expect(getCssFilesForChunk(entryA, bundle, cache)).toStrictEqual([
      'shared1.css',
      'shared2.css',
      'a.css',
    ])
    expect(getCssFilesForChunk(entryB, bundle, cache)).toStrictEqual([
      'shared2.css',
      'shared1.css',
      'b.css',
    ])
  })

  test('cache from one entry does not corrupt results for another with overlapping subgraph', () => {
    //        entryA        entryB
    //       /      \          |
    //    mid1     mid2      mid2
    //      |       |          |
    //    leaf    shared     shared
    const shared = createChunk('shared.js', [], ['shared.css'])
    const leaf = createChunk('leaf.js', [], ['leaf.css'])
    const mid1 = createChunk('mid1.js', ['leaf.js'], ['mid1.css'])
    const mid2 = createChunk('mid2.js', ['shared.js'], ['mid2.css'])
    const entryA = createChunk('a.js', ['mid1.js', 'mid2.js'], ['a.css'])
    const entryB = createChunk('b.js', ['mid2.js'], ['b.css'])
    const bundle = createBundle(entryA, entryB, mid1, mid2, leaf, shared)
    const cache = new Map<OutputChunk, string[]>()
    expect(getCssFilesForChunk(entryA, bundle, cache)).toStrictEqual([
      'leaf.css',
      'mid1.css',
      'shared.css',
      'mid2.css',
      'a.css',
    ])
    expect(getCssFilesForChunk(entryB, bundle, cache)).toStrictEqual([
      'shared.css',
      'mid2.css',
      'b.css',
    ])
  })

  test('cached chunk does not lose CSS that was already in seenCss during first entry (#21298)', () => {
    // entry  → chunk1 (chunk1.css, chunk-shared.css)
    //        → chunk2 (chunk2.css, chunk-shared.css)
    // entry2 → chunk2
    const chunk1 = createChunk(
      'chunk1.js',
      [],
      ['chunk1.css', 'chunk-shared.css'],
    )
    const chunk2 = createChunk(
      'chunk2.js',
      [],
      ['chunk2.css', 'chunk-shared.css'],
    )
    const entry = createChunk(
      'entry.js',
      ['chunk1.js', 'chunk2.js'],
      ['entry.css'],
    )
    const entry2 = createChunk('entry2.js', ['chunk2.js'], ['entry2.css'])
    const bundle = createBundle(entry, entry2, chunk1, chunk2)
    const cache = new Map<OutputChunk, string[]>()

    expect(getCssFilesForChunk(entry, bundle, cache)).toStrictEqual([
      'chunk1.css',
      'chunk-shared.css',
      'chunk2.css',
      'entry.css',
    ])
    expect(getCssFilesForChunk(entry2, bundle, cache)).toStrictEqual([
      'chunk2.css',
      'chunk-shared.css',
      'entry2.css',
    ])
  })

  test('dirty leaf chunk CSS is not lost through cached parent (#21298 edge case)', () => {
    //  entry1 → other (shared.css)
    //         → mid   → leaf (shared.css, leaf.css)
    //  entry2 → mid   → leaf (shared.css, leaf.css)
    const leaf = createChunk('leaf.js', [], ['shared.css', 'leaf.css'])
    const mid = createChunk('mid.js', ['leaf.js'], ['mid.css'])
    const other = createChunk('other.js', [], ['shared.css'])
    const entry1 = createChunk(
      'entry1.js',
      ['other.js', 'mid.js'],
      ['entry1.css'],
    )
    const entry2 = createChunk('entry2.js', ['mid.js'], ['entry2.css'])
    const bundle = createBundle(entry1, entry2, other, mid, leaf)
    const cache = new Map<OutputChunk, string[]>()

    expect(getCssFilesForChunk(entry1, bundle, cache)).toStrictEqual([
      'shared.css',
      'leaf.css',
      'mid.css',
      'entry1.css',
    ])
    // entry2 must still get shared.css via leaf, even though mid's cache
    // was built while shared.css was already seen
    expect(getCssFilesForChunk(entry2, bundle, cache)).toStrictEqual([
      'shared.css',
      'leaf.css',
      'mid.css',
      'entry2.css',
    ])
  })

  test('circular imports do not cause infinite loop', () => {
    const a = createChunk('a.js', ['b.js'], ['a.css'])
    const b = createChunk('b.js', ['a.js'], ['b.css'])
    const bundle = createBundle(a, b)
    const cache = new Map<OutputChunk, string[]>()
    expect(getCssFilesForChunk(a, bundle, cache)).toStrictEqual([
      'b.css',
      'a.css',
    ])
  })
})

describe('CSP nonce HTML hooks', () => {
  test('injectCspNonceMetaTagHook injects only shared meta tag for string config', async () => {
    const config = await resolveHtmlConfig('__NONCE__')

    expect(injectCspNonceMetaTagHook(config)()).toEqual([
      {
        tag: 'meta',
        injectTo: 'head',
        attrs: {
          property: 'csp-nonce',
          nonce: '__NONCE__',
        },
      },
    ])
  })

  test('injectCspNonceMetaTagHook injects split meta tags and omits empty values', async () => {
    const config = await resolveHtmlConfig({
      script: '',
      style: '__STYLE_NONCE__',
    })

    expect(injectCspNonceMetaTagHook(config)()).toEqual([
      {
        tag: 'meta',
        injectTo: 'head',
        attrs: {
          property: 'csp-style-nonce',
          nonce: '__STYLE_NONCE__',
        },
      },
    ])
  })

  test('injectNonceAttributeTagHook applies shared nonce to script and style destinations only', async () => {
    const config = await resolveHtmlConfig('__NONCE__')
    const html = [
      '<link rel="stylesheet" href="/style.css">',
      '<link rel="modulepreload" href="/dep.js">',
      '<link rel="preload" as="script" href="/dep.js">',
      '<link rel="preload" as="style" href="/dep.css">',
      '<link rel="preload" as="image" href="/image.png">',
      '<link rel="preload" as="font" href="/font.woff2" crossorigin>',
      '<style>.foo { color: red }</style>',
      '<script type="module" src="/main.js"></script>',
    ].join('\n')

    const transformed = await injectNonceAttributeTagHook(config)(html, {
      filename: '/index.html',
    } as any)

    expect(transformed).toContain(
      '<link rel="stylesheet" href="/style.css" nonce="__NONCE__">',
    )
    expect(transformed).toContain(
      '<link rel="modulepreload" href="/dep.js" nonce="__NONCE__">',
    )
    expect(transformed).toContain(
      '<link rel="preload" as="script" href="/dep.js" nonce="__NONCE__">',
    )
    expect(transformed).toContain(
      '<link rel="preload" as="style" href="/dep.css" nonce="__NONCE__">',
    )
    expect(transformed).toContain(
      '<style nonce="__NONCE__">.foo { color: red }</style>',
    )
    expect(transformed).toContain(
      '<script type="module" src="/main.js" nonce="__NONCE__"></script>',
    )
    expect(transformed).not.toMatch(/as="image"[^>]*\snonce=/)
    expect(transformed).not.toMatch(/as="font"[^>]*\snonce=/)
  })

  test('injectNonceAttributeTagHook routes split nonces by destination', async () => {
    const config = await resolveHtmlConfig({
      script: '__SCRIPT_NONCE__',
      style: '__STYLE_NONCE__',
    })
    const html = [
      '<link rel="stylesheet" href="/style.css">',
      '<link rel="modulepreload" href="/dep.js">',
      '<link rel="preload" as="script" href="/dep.js">',
      '<link rel="preload" as="style" href="/dep.css">',
      '<link rel="preload" as="image" href="/image.png">',
      '<link rel="preload" as="font" href="/font.woff2" crossorigin>',
      '<style>.foo { color: red }</style>',
      '<script type="module" src="/main.js"></script>',
    ].join('\n')

    const transformed = await injectNonceAttributeTagHook(config)(html, {
      filename: '/index.html',
    } as any)

    expect(transformed).toContain(
      '<link rel="stylesheet" href="/style.css" nonce="__STYLE_NONCE__">',
    )
    expect(transformed).toContain(
      '<link rel="modulepreload" href="/dep.js" nonce="__SCRIPT_NONCE__">',
    )
    expect(transformed).toContain(
      '<link rel="preload" as="script" href="/dep.js" nonce="__SCRIPT_NONCE__">',
    )
    expect(transformed).toContain(
      '<link rel="preload" as="style" href="/dep.css" nonce="__STYLE_NONCE__">',
    )
    expect(transformed).toContain(
      '<style nonce="__STYLE_NONCE__">.foo { color: red }</style>',
    )
    expect(transformed).toContain(
      '<script type="module" src="/main.js" nonce="__SCRIPT_NONCE__"></script>',
    )
    expect(transformed).not.toMatch(/as="image"[^>]*\snonce=/)
    expect(transformed).not.toMatch(/as="font"[^>]*\snonce=/)
  })

  test('injectNonceAttributeTagHook omits empty split destinations and does not repeat nonce attributes', async () => {
    const config = await resolveHtmlConfig({
      script: '',
      style: '__STYLE_NONCE__',
    })
    const html = [
      '<link rel="stylesheet" href="/style.css">',
      '<script type="module" src="/main.js"></script>',
      '<script nonce="__EXISTING__">console.log("ok")</script>',
      '<style>.foo { color: red }</style>',
    ].join('\n')

    const transformed = await injectNonceAttributeTagHook(config)(html, {
      filename: '/index.html',
    } as any)

    expect(transformed).toContain(
      '<link rel="stylesheet" href="/style.css" nonce="__STYLE_NONCE__">',
    )
    expect(transformed).toContain(
      '<style nonce="__STYLE_NONCE__">.foo { color: red }</style>',
    )
    expect(transformed).toContain(
      '<script type="module" src="/main.js"></script>',
    )
    expect(transformed).toContain(
      '<script nonce="__EXISTING__">console.log("ok")</script>',
    )
  })
})
