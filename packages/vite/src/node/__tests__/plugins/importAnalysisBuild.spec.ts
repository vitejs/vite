import { beforeAll, describe, expect, test } from 'vitest'
import { init, parse as parseImports } from 'es-module-lexer'
import {
  matchImportsToPreloadMarkers,
  preloadMarker,
} from '../../plugins/importAnalysisBuild'

beforeAll(async () => {
  await init
})

// the start position of every `__VITE_PRELOAD__` marker, in source order
function markerPositions(code: string): number[] {
  const positions: number[] = []
  for (
    let pos = code.indexOf(preloadMarker);
    pos !== -1;
    pos = code.indexOf(preloadMarker, pos + preloadMarker.length)
  ) {
    positions.push(pos)
  }
  return positions
}

// pair dynamic imports with markers the way the plugin does (see `generateBundle`)
function match(code: string) {
  const imports = parseImports(code)[0].filter((i) => i.d > -1)
  return matchImportsToPreloadMarkers(code, imports)
}

describe('matchImportsToPreloadMarkers', () => {
  test('returns an empty array when there are no imports', () => {
    expect(matchImportsToPreloadMarkers('const a = 1', [])).toStrictEqual([])
  })

  test('pairs a single dynamic import with its marker', () => {
    const code = `__vitePreload(() => import('a'), ${preloadMarker})`
    const [marker] = markerPositions(code)
    expect(match(code)).toStrictEqual([marker])
  })

  test('gives sibling imports their own markers (Rollup-era interleaved shape)', () => {
    // markers stay interleaved: import a < Ma < import b < Mb
    const code =
      `__vitePreload(() => import('a'), ${preloadMarker})` +
      `.then(() => __vitePreload(() => import('b'), ${preloadMarker}))`
    const [markerA, markerB] = markerPositions(code)
    expect(match(code)).toStrictEqual([markerA, markerB])
  })

  test('gives a nested `import().then(() => import())` each its own marker (#22700)', () => {
    // Rolldown wraps the whole `.then`, so the inner marker comes before the outer one:
    // the outer import must NOT be paired with the inner marker it textually precedes.
    const code =
      `__vitePreload(() => import('a').then(() => ` +
      `__vitePreload(() => import('b'), ${preloadMarker})), ${preloadMarker})`
    const [innerMarker, outerMarker] = markerPositions(code)
    // source order: [0] = import('a') (outer), [1] = import('b') (inner)
    expect(match(code)).toStrictEqual([outerMarker, innerMarker])
  })

  test('#3051: a lone import whose marker precedes it still pairs with that marker', () => {
    const code = `const x = ${preloadMarker};import('a')`
    const [marker] = markerPositions(code)
    expect(match(code)).toStrictEqual([marker])
  })
})
