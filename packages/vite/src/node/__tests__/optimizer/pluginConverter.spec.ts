import type * as esbuild from 'esbuild'
import { describe, expect, test } from 'vitest'
import { convertEsbuildPluginToRolldownPlugin } from '../../optimizer/pluginConverter'

type ConvertedPluginHooks = {
  options(inputOptions: { plugins: []; platform: 'browser' }): Promise<void>
  generateBundle(): void
}

describe('convertEsbuildPluginToRolldownPlugin', () => {
  test('passes a valid build result to onEnd callbacks', async () => {
    let buildResult: esbuild.BuildResult | undefined

    const plugin = convertEsbuildPluginToRolldownPlugin({
      name: 'read-metafile',
      setup(build) {
        build.onEnd((result) => {
          buildResult = result
          expect(result.metafile).toBeUndefined()
        })
      },
    }) as ConvertedPluginHooks

    await plugin.options({ plugins: [], platform: 'browser' })
    plugin.generateBundle()

    expect(buildResult).toEqual({
      errors: [],
      warnings: [],
      outputFiles: undefined,
      metafile: undefined,
      mangleCache: undefined,
    })
  })
})
