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

    // code contains esbuild helpers followed by the IIFE wrapper
    const code =
      'var __defProp = Object.defineProperty; var MyModule = (function() { "use strict"; const a = { ...b }; return a; })();'
    const chunk: any = { fileName: 'test.js' }
    const opts: any = { format: 'iife' }

    const result = await plugin.renderChunk.call(plugin, code, chunk, opts)

    expect(result.code).toContain('var MyModule = (function()')
    // Verification that helpers are injected inside the wrapper after "use strict";
    expect(result.code).toMatch(/"use strict";\s*var\s+__defProp/)
  })
})
