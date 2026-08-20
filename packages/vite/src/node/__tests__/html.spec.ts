import { describe, expect, test } from 'vitest'
import type { OutputBundle, OutputChunk } from 'rolldown'
import {
  getCssFilesForChunk,
  injectToBody,
  injectToHead,
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

describe('injectToHead/injectToBody (#18386: skip HTML comments)', () => {
  const scriptTag = {
    tag: 'script',
    attrs: { type: 'module', src: '/@vite/client' },
  }

  test('injectToHead injects after the real <head>, not one inside a comment', () => {
    const html = [
      '<!-- <!DOCTYPE html>',
      '<html lang="en">',
      '  <head>',
      '    <title>old</title>',
      '  </head>',
      '  <body></body>',
      '</html> -->',
      '<!DOCTYPE html>',
      '<html lang="en">',
      '  <head>',
      '    <title>real</title>',
      '  </head>',
      '  <body></body>',
      '</html>',
    ].join('\n')

    const out = injectToHead(html, [scriptTag], true)

    // The injected script must not be placed inside the leading comment
    const commentEnd = out.indexOf('-->')
    const injected = out.indexOf('/@vite/client')
    expect(injected).toBeGreaterThan(commentEnd)
    // And it must be inside the real head (before </head> of the real document)
    const realHeadOpen = out.indexOf('<head>', commentEnd)
    const realHeadClose = out.indexOf('</head>', realHeadOpen)
    expect(injected).toBeGreaterThan(realHeadOpen)
    expect(injected).toBeLessThan(realHeadClose)
    // The original commented document should remain unchanged
    expect(out).toContain(
      '<!-- <!DOCTYPE html>\n<html lang="en">\n  <head>\n    <title>old</title>\n  </head>\n  <body></body>\n</html> -->',
    )
  })

  test('injectToHead (append) injects before the real </head>, not one inside a comment', () => {
    const html = [
      '<!DOCTYPE html>',
      '<html>',
      '  <head>',
      '    <!-- legacy </head> reference inside a comment -->',
      '    <title>real</title>',
      '  </head>',
      '  <body></body>',
      '</html>',
    ].join('\n')

    const out = injectToHead(html, [scriptTag])

    const commentStart = out.indexOf('<!--')
    const commentEnd = out.indexOf('-->', commentStart)
    const injected = out.indexOf('/@vite/client')
    // Injected tag must not land inside the comment
    expect(injected < commentStart || injected > commentEnd).toBe(true)
    // Injected tag must be just before the real </head>
    const realHeadClose = out.lastIndexOf('</head>')
    expect(injected).toBeLessThan(realHeadClose)
  })

  test('injectToBody injects before the real </body>, not one inside a comment', () => {
    const html = [
      '<!DOCTYPE html>',
      '<html>',
      '  <head></head>',
      '  <body>',
      '    <!-- prior layout had </body> here -->',
      '    <div id="root"></div>',
      '  </body>',
      '</html>',
    ].join('\n')

    const out = injectToBody(html, [scriptTag])

    const commentStart = out.indexOf('<!--')
    const commentEnd = out.indexOf('-->', commentStart)
    const injected = out.indexOf('/@vite/client')
    expect(injected < commentStart || injected > commentEnd).toBe(true)
    const realBodyClose = out.lastIndexOf('</body>')
    expect(injected).toBeLessThan(realBodyClose)
    // The original commented marker should still be present unchanged
    expect(out).toContain('<!-- prior layout had </body> here -->')
  })

  test('injectToHead falls back to body when only commented head exists', () => {
    const html = [
      '<!DOCTYPE html>',
      '<!-- <head></head> -->',
      '<html>',
      '  <body>',
      '    <div id="root"></div>',
      '  </body>',
      '</html>',
    ].join('\n')

    const out = injectToHead(html, [scriptTag])

    // Must not be injected inside the comment
    const commentStart = out.indexOf('<!--')
    const commentEnd = out.indexOf('-->', commentStart)
    const injected = out.indexOf('/@vite/client')
    expect(injected < commentStart || injected > commentEnd).toBe(true)
    // Should land before the real <body>
    const bodyOpen = out.indexOf('<body>')
    expect(injected).toBeLessThan(bodyOpen)
    // The comment itself remains intact
    expect(out).toContain('<!-- <head></head> -->')
  })
})
