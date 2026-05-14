import type * as esbuild from 'esbuild'
import { describe, expect, test } from 'vitest'
import { convertEsbuildPluginToRolldownPlugin } from '../../optimizer/pluginConverter'
import type { Plugin } from '../../plugin'

type ConvertedPluginHooks = {
  options: Extract<Plugin['options'], Function>
  generateBundle: Extract<Plugin['generateBundle'], Function>
}

describe('convertEsbuildPluginToRolldownPlugin', () => {
  test('passes a BuildResult to onEnd callbacks', async () => {
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

    await plugin.options.call({} as any, { plugins: [], platform: 'browser' })
    await plugin.generateBundle.call({} as any, {} as any, {} as any, true)

    expect(buildResult).toEqual({
      outputFiles: undefined,
      metafile: undefined,
      mangleCache: undefined,
    })
  })
})
