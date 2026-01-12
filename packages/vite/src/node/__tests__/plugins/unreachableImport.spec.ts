import { describe, expect, test } from 'vitest'
import { isUnreachableDynamicImport } from '../../plugins/importAnalysisBuild'

describe('isUnreachableDynamicImport', () => {
  test('detects import after simple return', () => {
    const source = `
function test() {
  return;
  import('./module.js')
}`
    const importStart = source.indexOf('import(')
    expect(isUnreachableDynamicImport(source, importStart)).toBe(true)
  })

  test('detects import after return with value', () => {
    const source = `
function test() {
  return void 0;
  import('./module.js')
}`
    const importStart = source.indexOf('import(')
    expect(isUnreachableDynamicImport(source, importStart)).toBe(true)
  })

  test('detects import after throw', () => {
    const source = `
function test() {
  throw new Error('error');
  import('./module.js')
}`
    const importStart = source.indexOf('import(')
    expect(isUnreachableDynamicImport(source, importStart)).toBe(true)
  })

  test('does not flag reachable import', () => {
    const source = `
function test() {
  const result = import('./module.js')
  return result
}`
    const importStart = source.indexOf('import(')
    expect(isUnreachableDynamicImport(source, importStart)).toBe(false)
  })

  test('does not flag import in conditional branch', () => {
    const source = `
function test(condition) {
  if (condition) {
    return;
  }
  import('./module.js')
}`
    const importStart = source.indexOf('import(')
    expect(isUnreachableDynamicImport(source, importStart)).toBe(false)
  })

  test('detects import after return in nested block', () => {
    const source = `
function outer() {
  function inner() {
    return;
    import('./module.js')
  }
}`
    const importStart = source.indexOf('import(')
    expect(isUnreachableDynamicImport(source, importStart)).toBe(true)
  })

  test('does not flag import before return', () => {
    const source = `
function test() {
  import('./module.js')
  return;
}`
    const importStart = source.indexOf('import(')
    expect(isUnreachableDynamicImport(source, importStart)).toBe(false)
  })

  test('detects import after if-true return', () => {
    const source = `
function test() {
  if (true) return;
  import('./module.js')
}`
    const importStart = source.indexOf('import(')
    expect(isUnreachableDynamicImport(source, importStart)).toBe(true)
  })

  // Edge cases for strings and comments (Graphite Agent feedback)
  test('does not flag import when return is inside string literal', () => {
    const source = `
function test() {
  const msg = "return;";
  import('./module.js')
}`
    const importStart = source.indexOf('import(')
    expect(isUnreachableDynamicImport(source, importStart)).toBe(false)
  })

  test('does not flag import when brace is inside string literal', () => {
    const source = `
function test() {
  const str = "{ fake brace";
  return;
  import('./module.js')
}`
    const importStart = source.indexOf('import(')
    expect(isUnreachableDynamicImport(source, importStart)).toBe(true)
  })

  test('does not flag import when return is inside comment', () => {
    const source = `
function test() {
  // return;
  import('./module.js')
}`
    const importStart = source.indexOf('import(')
    expect(isUnreachableDynamicImport(source, importStart)).toBe(false)
  })

  test('does not flag import when return is inside multi-line comment', () => {
    const source = `
function test() {
  /* return; */
  import('./module.js')
}`
    const importStart = source.indexOf('import(')
    expect(isUnreachableDynamicImport(source, importStart)).toBe(false)
  })

  test('does not flag import when return is inside template literal', () => {
    const source = `
function test() {
  const msg = \`return;\`;
  import('./module.js')
}`
    const importStart = source.indexOf('import(')
    expect(isUnreachableDynamicImport(source, importStart)).toBe(false)
  })
})
