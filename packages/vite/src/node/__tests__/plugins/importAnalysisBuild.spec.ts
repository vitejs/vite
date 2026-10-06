import vm from 'node:vm'
import { init, parse as parseImports } from 'es-module-lexer'
import { beforeAll, describe, expect, test } from 'vitest'
import {
  getPreloadCode,
  isCssPreloadUrl,
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

describe('isCssPreloadUrl', () => {
  test('detects css assets with query strings or hashes', () => {
    const cases: ReadonlyArray<[string, boolean]> = [
      ['https://example.com/assets/lazy.css', true],
      ['https://example.com/assets/lazy.css?dpl=123', true],
      ['https://example.com/assets/lazy.css#hash', true],
      ['https://example.com/assets/lazy.js?file=.css', false],
    ]
    for (const [input, expected] of cases) {
      const inputUrl = new URL(input)
      expect(isCssPreloadUrl(inputUrl)).toBe(expected)
    }
  })
})

describe('__vitePreload helper', () => {
  function createPreloadHelper() {
    const code = getPreloadCode(
      {
        config: {
          base: '/',
          build: { modulePreload: { polyfill: true } },
        },
      } as any,
      false,
      false,
    )

    const links: FakeLink[] = []
    class FakeLink extends EventTarget {
      rel = ''
      as = ''
      href = ''
      crossOrigin = ''
      setAttribute() {
        // noop
      }
    }

    const context = vm.createContext({
      __VITE_IS_MODERN__: true,
      __vite_ssr_import_meta__: { url: 'http://localhost/assets/main.js' },
      document: {
        getElementsByTagName: () => links,
        querySelector: () => null,
        createElement: () => new FakeLink(),
        head: {
          appendChild: (link: FakeLink) => links.push(link),
        },
      },
      window: new EventTarget(),
      Event,
      EventTarget,
      Promise,
      URL,
      Error,
    })

    vm.runInContext(
      code.replace('export const __vitePreload', 'globalThis.__vitePreload'),
      context,
    )

    return {
      preload: context.__vitePreload as (
        baseModule: () => Promise<unknown>,
        deps?: string[],
      ) => Promise<unknown>,
      links,
    }
  }

  test('makes every dynamic import wait for in-flight stylesheets', async () => {
    const { preload, links } = createPreloadHelper()
    let firstSettled = false
    let secondSettled = false

    preload(() => Promise.resolve('chunk'), ['assets/lazy.css']).then(() => {
      firstSettled = true
    })
    preload(() => Promise.resolve('chunk'), ['assets/lazy.css']).then(() => {
      secondSettled = true
    })

    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(firstSettled).toBe(false)
    expect(secondSettled).toBe(false)
    expect(links).toHaveLength(1)
    expect(links[0].href).toBe('http://localhost/assets/lazy.css')

    links[0].dispatchEvent(new Event('load'))
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(firstSettled).toBe(true)
    expect(secondSettled).toBe(true)

    // A third import after the CSS has loaded resolves immediately
    let thirdSettled = false
    preload(() => Promise.resolve('chunk'), ['assets/lazy.css']).then(() => {
      thirdSettled = true
    })
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(thirdSettled).toBe(true)
    expect(links).toHaveLength(1)
  })

  test('fails all waiting imports when stylesheet fails to load', async () => {
    const { preload, links } = createPreloadHelper()
    let firstRejected: unknown = null
    let secondRejected: unknown = null

    preload(() => Promise.resolve('chunk'), ['assets/lazy.css']).catch(
      (err) => {
        firstRejected = err
      },
    )
    preload(() => Promise.resolve('chunk'), ['assets/lazy.css']).catch(
      (err) => {
        secondRejected = err
      },
    )

    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(links).toHaveLength(1)

    links[0].dispatchEvent(new Event('error'))
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(firstRejected).toBeInstanceOf(Error)
    expect(secondRejected).toBeInstanceOf(Error)
  })
})
