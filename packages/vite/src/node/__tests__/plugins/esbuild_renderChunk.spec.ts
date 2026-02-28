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
    
    expect(result.code).toContain('(function')
    // Verification that helpers are injected inside the wrapper
    // injectEsbuildHelpers replaces "use strict"; with "use strict"; + helpers
    expect(result.code).toMatch(/"use strict";\s*var\s+__/)
  })
})
