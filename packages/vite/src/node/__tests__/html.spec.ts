import { describe, expect, test } from 'vitest'
import type {
  GetModuleInfo,
  ModuleInfo,
  OutputBundle,
  OutputChunk,
} from 'rolldown'
import { getCssFilesForChunk } from '../plugins/html'

function createChunk(
  fileName: string,
  imports: string[],
  importedCss: string[],
  options: { facadeModuleId?: string; modules?: string[] } = {},
): OutputChunk {
  const modules: Record<string, unknown> = {}
  if (options.modules) {
    for (const id of options.modules) {
      modules[id] = {}
    }
  }
  return {
    type: 'chunk',
    fileName,
    imports,
    viteMetadata: { importedCss: new Set(importedCss) },
    facadeModuleId: options.facadeModuleId,
    modules,
  } as unknown as OutputChunk
}

function createBundle(...chunks: OutputChunk[]): OutputBundle {
  const bundle: Record<string, OutputChunk> = {}
  for (const chunk of chunks) {
    bundle[chunk.fileName] = chunk
  }
  return bundle as unknown as OutputBundle
}

function createModuleInfoMap(edges: Record<string, string[]>): GetModuleInfo {
  return ((id: string) => {
    if (!(id in edges)) return null
    return { importedIds: edges[id] } as ModuleInfo
  }) as GetModuleInfo
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

  describe('source-import order (#4890)', () => {
    // Models a chunk that imports two pure-CSS chunks via two of its modules
    // (one nested through `vendor.js`, one direct). `chunk.imports` order
    // does NOT match source-import order, so the previous algorithm - which
    // walked `chunk.imports` - placed the override stylesheet before the
    // baseline stylesheet, inverting the cascade.
    function buildOpRepro() {
      const vendorCss = createChunk('vendor.css.js', [], ['vendor.css'])
      const overrideCss = createChunk('override.css.js', [], ['override.css'])
      // Note: chunk.imports lists override BEFORE vendor on purpose, to
      // demonstrate that the chunk-import order does not reflect source.
      const shared = createChunk(
        'shared.js',
        ['override.css.js', 'vendor.css.js'],
        [],
        {
          facadeModuleId: '/src/main.js',
          modules: ['/src/main.js', '/src/vendor.js'],
        },
      )
      const entry = createChunk('entry.js', ['shared.js'], [], {
        facadeModuleId: '/src/main.js',
        modules: ['/src/main.js'],
      })
      const bundle = createBundle(entry, shared, vendorCss, overrideCss)

      // Source code:
      //   main.js: `import './vendor.js'; import './override.css';`
      //   vendor.js: `import './vendor.css';`
      const getModuleInfo = createModuleInfoMap({
        '/src/main.js': ['/src/vendor.js', '/src/override.css'],
        '/src/vendor.js': ['/src/vendor.css'],
        '/src/vendor.css': [],
        '/src/override.css': [],
      })
      const cssModuleFileMap = new Map<string, string>([
        ['/src/vendor.css', 'vendor.css'],
        ['/src/override.css', 'override.css'],
      ])

      return { entry, bundle, getModuleInfo, cssModuleFileMap }
    }

    test('chunk-import-only walk produces wrong order', () => {
      // Without module info we fall back to the old chunk-import walk; this
      // is the bug we are fixing. The override stylesheet is emitted before
      // the vendor stylesheet because that is the order chunk.imports lists
      // them in.
      const { entry, bundle } = buildOpRepro()
      const cache = new Map<OutputChunk, string[]>()
      expect(getCssFilesForChunk(entry, bundle, cache)).toStrictEqual([
        'override.css',
        'vendor.css',
      ])
    })

    test('module-graph walk places vendor.css before override.css (fix)', () => {
      // Regression for https://github.com/vitejs/vite/issues/4890: with module
      // info, the `<link>` tags follow source-import order, so the override
      // stylesheet loads after the vendor stylesheet it is meant to override.
      const { entry, bundle, getModuleInfo, cssModuleFileMap } = buildOpRepro()
      const cache = new Map<OutputChunk, string[]>()
      expect(
        getCssFilesForChunk(
          entry,
          bundle,
          cache,
          cssModuleFileMap,
          getModuleInfo,
        ),
      ).toStrictEqual(['vendor.css', 'override.css'])
    })

    test('two entries that share a chunk both get the corrected order', () => {
      // Regression for https://github.com/vitejs/vite/issues/4890 - the
      // multi-entry shape originally reported there: two entries sharing the
      // same imports must both emit CSS in source-import order.
      const { bundle, cssModuleFileMap } = buildOpRepro()
      const entry2 = createChunk('entry2.js', ['shared.js'], [], {
        facadeModuleId: '/src/entry2/main.js',
        modules: ['/src/entry2/main.js'],
      })
      ;(bundle as Record<string, OutputChunk>)['entry2.js'] = entry2
      // entry2/main.js imports the same vendor + override in the same order.
      const getModuleInfo = createModuleInfoMap({
        '/src/main.js': ['/src/vendor.js', '/src/override.css'],
        '/src/entry2/main.js': ['/src/vendor.js', '/src/override.css'],
        '/src/vendor.js': ['/src/vendor.css'],
        '/src/vendor.css': [],
        '/src/override.css': [],
      })
      const cache = new Map<OutputChunk, string[]>()
      const entry = (bundle as Record<string, OutputChunk>)['entry.js']
      expect(
        getCssFilesForChunk(
          entry,
          bundle,
          cache,
          cssModuleFileMap,
          getModuleInfo,
        ),
      ).toStrictEqual(['vendor.css', 'override.css'])
      expect(
        getCssFilesForChunk(
          entry2,
          bundle,
          cache,
          cssModuleFileMap,
          getModuleInfo,
        ),
      ).toStrictEqual(['vendor.css', 'override.css'])
    })

    test('falls back to chunk-import walk for CSS not in cssModuleFileMap', () => {
      // If a chunk has CSS files that aren't covered by cssModuleFileMap
      // (e.g., emitted outside the normal `renderChunk` flow), they should
      // still appear via the fallback walk so we don't drop links.
      const helper = createChunk('helper.js', [], ['helper.css'], {
        facadeModuleId: '/src/helper.js',
        modules: ['/src/helper.js'],
      })
      const entry = createChunk('entry.js', ['helper.js'], [], {
        facadeModuleId: '/src/main.js',
        modules: ['/src/main.js'],
      })
      const bundle = createBundle(entry, helper)
      const getModuleInfo = createModuleInfoMap({
        '/src/main.js': ['/src/helper.js'],
        '/src/helper.js': [],
      })
      // Empty map - helper.css is not registered.
      const cssModuleFileMap = new Map<string, string>()
      const cache = new Map<OutputChunk, string[]>()
      expect(
        getCssFilesForChunk(
          entry,
          bundle,
          cache,
          cssModuleFileMap,
          getModuleInfo,
        ),
      ).toStrictEqual(['helper.css'])
    })
  })
})
