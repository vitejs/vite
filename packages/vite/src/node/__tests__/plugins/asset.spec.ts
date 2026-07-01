import MagicString from 'magic-string'
import { describe, expect, test } from 'vitest'
import { assetUrlRE, writeRuntimeAssetReplacement } from '../../plugins/asset'

describe('writeRuntimeAssetReplacement', () => {
  // Regression test for #22304: when the asset placeholder sits inside a
  // string literal and is preceded by a unary operator (typeof, void, !,
  // delete), the bare `"+runtime+"` substitution produces output that
  // parses as `(typeof "") + runtime + ""` instead of evaluating typeof
  // over the concatenated string. The fix wraps in parens.
  function rewrite(code: string, runtime: string): string {
    const s = new MagicString(code)
    assetUrlRE.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = assetUrlRE.exec(code))) {
      writeRuntimeAssetReplacement(s, code, match, match[0], runtime)
    }
    return s.toString()
  }

  test('wraps quoted placeholder so typeof binds to the runtime expression', () => {
    const out = rewrite(
      'if (typeof "__VITE_ASSET__abc__" === "string") {}',
      'new URL("./hero.png", import.meta.url).href',
    )
    expect(out).toBe(
      'if (typeof (""+new URL("./hero.png", import.meta.url).href+"") === "string") {}',
    )
  })

  test('uses parens when single quotes wrap the placeholder exactly', () => {
    const out = rewrite("var x = '__VITE_ASSET__abc__'", 'r()')
    expect(out).toBe('var x = (""+r()+"")')
  })

  test('uses parens when backticks wrap the placeholder exactly', () => {
    const out = rewrite('var x = `__VITE_ASSET__abc__`', 'r()')
    expect(out).toBe('var x = (""+r()+"")')
  })

  test('falls back to the legacy substitution outside string contexts', () => {
    // CSS-in-JS shape: the placeholder is inside a string but immediately
    // adjacent to non-quote characters (url(...) wrapper).
    const out = rewrite(
      'var s = ".foo{background:url(__VITE_ASSET__abc__)}"',
      'r()',
    )
    expect(out).toBe('var s = ".foo{background:url("+r()+")}"')
  })

  test('does not pair mismatched surrounding quotes', () => {
    // before='"' and after="'" should NOT be treated as a wrapped string,
    // so the bare substitution applies and the surrounding chars stay.
    const out = rewrite(`var x = "__VITE_ASSET__abc__'`, 'r()')
    expect(out).toBe(`var x = ""+r()+"'`)
  })
})
