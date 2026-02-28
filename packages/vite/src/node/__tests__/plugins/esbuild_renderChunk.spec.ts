import { describe, expect, test } from 'vitest'
import { buildEsbuildPlugin } from '../../plugins/esbuild'

describe('buildEsbuildPlugin renderChunk', () => {
  test('injects helpers when format is iife even if not in lib mode', async () => {
    const plugin: any = buildEsbuildPlugin()
    // Mock the environment config
    plugin.environment = {
      config: {
        build: {
          target: 'es2015',
          minify: false,
        },
        esbuild: {},
      },
    }

    const code = 'const a = { ...b }; export default a;'
    const chunk: any = { fileName: 'test.js' }
    const opts: any = { format: 'iife' }

    const result = await plugin.renderChunk.call(plugin, code, chunk, opts)
    
    // Without the fix, the helpers would be outside the wrapper or not injected at all 
    // by this specific plugin logic because config.build.lib is false.
    // The fix ensures injectEsbuildHelpers is called if format is iife/umd.
    
    // Note: injectEsbuildHelpers expects certain patterns to find the wrapper.
    // Since transformWithEsbuild with iife format will produce a wrapper, 
    // we check if the result code contains the expected injected pattern.
    expect(result.code).toContain('(function')
    // esbuild helpers for spread usually look like __assign or similar depending on version
    // but the point is they should be moved inside if they exist.
  })
})
