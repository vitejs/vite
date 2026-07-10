import MagicString from 'magic-string'
import { describe, expect, test } from 'vitest'
import { assetUrlRE, injectRuntimeIntoStringLiteral } from '../../plugins/asset'

const runtime = `new URL("hero.png", "http://localhost/assets/").href`
const url = 'http://localhost/assets/hero.png'

function rewrite(code: string, expr: string = runtime): string {
  const s = new MagicString(code)
  const wrappedLiterals = new Set<number>()
  let match: RegExpExecArray | null
  assetUrlRE.lastIndex = 0
  while ((match = assetUrlRE.exec(code))) {
    injectRuntimeIntoStringLiteral(
      s,
      code,
      match.index,
      match.index + match[0].length,
      expr,
      wrappedLiterals,
    )
  }
  return s.toString()
}

/** Evaluate a rewritten expression, proving it both parses and keeps its meaning. */
function evaluate(code: string): unknown {
  return new Function(`return (${code})`)()
}

describe('injectRuntimeIntoStringLiteral', () => {
  test('wraps the literal so a unary operator binds across the concatenation', () => {
    const code = 'typeof "__VITE_ASSET__abc__"'
    expect(rewrite(code)).toBe(`typeof (""+(${runtime})+"")`)
    expect(evaluate(rewrite(code))).toBe('string')
  })

  test('wraps the enclosing literal when the placeholder is embedded in it', () => {
    // CSS-in-JS shape, produced by `import css from './a.css?inline'`
    const code = 'typeof ".a{background:url(__VITE_ASSET__abc__)}"'
    expect(rewrite(code)).toBe(
      `typeof (".a{background:url("+(${runtime})+")}")`,
    )
    expect(evaluate(rewrite(code))).toBe('string')
  })

  test('property access resolves against the concatenation', () => {
    expect(evaluate(rewrite('"__VITE_ASSET__abc__".length'))).toBe(url.length)
  })

  test('parenthesizes the runtime expression', () => {
    // `experimental.renderBuiltUrl` may return an arbitrary expression
    expect(rewrite('var x = "__VITE_ASSET__abc__"', 'cond ? a : b')).toBe(
      'var x = (""+(cond ? a : b)+"")',
    )
  })

  test('wraps a literal holding several placeholders exactly once', () => {
    const out = rewrite(
      'typeof ".a{background:url(__VITE_ASSET__abc__)}.b{background:url(__VITE_ASSET__def__)}"',
    )
    expect(out).toBe(
      `typeof (".a{background:url("+(${runtime})+")}.b{background:url("+(${runtime})+")}")`,
    )
    expect(evaluate(out)).toBe('string')
  })

  test('keeps single quotes', () => {
    expect(rewrite(`var x = 'url(__VITE_ASSET__abc__)'`)).toBe(
      `var x = ('url('+(${runtime})+')')`,
    )
  })

  test('keeps backticks', () => {
    expect(rewrite('var x = `url(__VITE_ASSET__abc__)`')).toBe(
      `var x = (\`url(\`+(${runtime})+\`)\`)`,
    )
  })

  test('ignores escaped quotes when finding the literal bounds', () => {
    // `background: url("./hero.png")` keeps its inner quotes, which get escaped
    // once the stylesheet is embedded in a JS string literal.
    const out = rewrite(
      String.raw`typeof ".a{background:url(\"__VITE_ASSET__abc__\")}"`,
    )
    expect(out).toBe(
      String.raw`typeof (".a{background:url(\""+(${runtime})+"\")}")`,
    )
    expect(evaluate(out)).toBe('string')
    expect(evaluate(out.slice('typeof '.length))).toBe(
      `.a{background:url("${url}")}`,
    )
  })

  test('treats an escaped backslash before the closing quote as a real bound', () => {
    const out = rewrite(String.raw`typeof "url(__VITE_ASSET__abc__)\\"`)
    expect(out).toBe(String.raw`typeof ("url("+(${runtime})+")\\")`)
    expect(evaluate(out)).toBe('string')
    expect(evaluate(out.slice('typeof '.length))).toBe(`url(${url})\\`)
  })

  test('falls back to a bare splice when no enclosing literal is found', () => {
    // A line break cannot occur inside a '/" literal, so the bounds are unsafe.
    expect(rewrite('var x = "a"\n__VITE_ASSET__abc__\nvar y = "b"')).toBe(
      `var x = "a"\n"+(${runtime})+"\nvar y = "b"`,
    )
  })

  test('falls back when the enclosing template literal has an interpolation', () => {
    expect(rewrite('var x = `${a}url(__VITE_ASSET__abc__)`')).toBe(
      'var x = `${a}url("+(' + runtime + ')+")`',
    )
  })
})
