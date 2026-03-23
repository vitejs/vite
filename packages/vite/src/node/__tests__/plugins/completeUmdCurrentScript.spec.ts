import { describe, expect, test } from 'vitest'
import { completeUmdCurrentScriptPlugin } from '../../plugins/completeUmdCurrentScript'

async function createRenderChunk() {
  const instance = completeUmdCurrentScriptPlugin()

  return async (code: string, format: string = 'umd') => {
    // @ts-expect-error renderChunk signature is simplified for testing
    const result = await instance.renderChunk.call(instance, code, 'foo.ts', {
      format,
    })
    return result?.code ?? result
  }
}

describe('completeUmdCurrentScriptPlugin', async () => {
  const renderChunk = await createRenderChunk()

  test('captures document.currentScript and replaces references', async () => {
    const input =
      '(function(global, factory) { })(this, function() { var url = document.currentScript && document.currentScript.src; })'
    expect(await renderChunk(input)).toMatchInlineSnapshot(
      `"var __vite_currentScript = typeof document !== "undefined" ? document.currentScript : null;(function(global, factory) { })(this, function() { var url = __vite_currentScript && __vite_currentScript.src; })"`,
    )
  })

  test('leaves code unchanged when no document.currentScript references', async () => {
    const input =
      '(function(global, factory) { })(this, function() { return 42; })'
    expect(await renderChunk(input)).toBeUndefined()
  })

  test('skips non-umd formats', async () => {
    const input = '(function() { var url = document.currentScript.src; })()'
    expect(await renderChunk(input, 'iife')).toBeUndefined()
    expect(await renderChunk(input, 'es')).toBeUndefined()
    expect(await renderChunk(input, 'cjs')).toBeUndefined()
  })

  test('replaces all occurrences', async () => {
    const input =
      '(function(global, factory) { })(this, function() { var a = document.currentScript.src; var b = document.currentScript.tagName; })'
    const result = (await renderChunk(input))!
    // the capture prefix references document.currentScript once, but the original code should have all replaced
    expect(result).toContain('__vite_currentScript.src')
    expect(result).toContain('__vite_currentScript.tagName')
    // only one occurrence of document.currentScript should remain (in the capture)
    expect(result.match(/document\.currentScript/g)).toHaveLength(1)
  })
})
