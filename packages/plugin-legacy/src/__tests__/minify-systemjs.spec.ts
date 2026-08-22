import { minifySync } from 'rolldown/experimental'
import { describe, expect, test } from 'vitest'

// Regression tests for https://github.com/vitejs/vite/issues/23296
//
// When legacy chunks are minified with the oxc minifier using `module: true`
// (derived from output.format='esm'), block-scoped function declarations are
// eliminated as dead code under strict-mode semantics. In sloppy mode
// (SystemJS output), Annex B.3.3 hoists these functions to the enclosing
// function scope, making them reachable. The fix calls minifySync with
// `module: false` so the minifier uses sloppy-mode semantics.

describe('minifySync module flag for SystemJS legacy chunks', () => {
  // A block-scoped function that is only reachable outside its block
  // via sloppy-mode Annex B.3.3 hoisting. In strict mode, the call
  // after the block is a ReferenceError, so the minifier with
  // module:true can DCE the entire function body.
  const sloppyHoistingCode =
    'function wrapper(){var result="before";{function setInner(){result="hoisted"}}setInner();return result}wrapper()'

  test('module: true eliminates block-scoped functions (strict-mode DCE)', () => {
    const result = minifySync('test.js', sloppyHoistingCode, {
      module: true,
      compress: true,
      mangle: true,
    })
    // The function body is eliminated: 'hoisted' string is gone
    expect(result.code).not.toMatch(/hoisted/)
  })

  test('module: false preserves block-scoped functions (sloppy-mode safe)', () => {
    const result = minifySync('test.js', sloppyHoistingCode, {
      module: false,
      compress: true,
      mangle: true,
    })
    // The function body is preserved: 'hoisted' string survives
    expect(result.code).toMatch(/hoisted/)
  })

  test('compress target es2015 does not introduce newer syntax', () => {
    const code = 'try{foo()}catch(e){bar()}'
    const result = minifySync('test.js', code, {
      module: false,
      compress: { target: 'es2015' },
      mangle: true,
    })
    // ES2019 catch binding omission must not appear
    expect(result.code).toMatch(/catch\s*\(/)
    expect(result.code).not.toMatch(/catch\s*\{/)
  })
})
