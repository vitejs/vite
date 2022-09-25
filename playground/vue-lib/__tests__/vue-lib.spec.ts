import path from 'node:path'
import { build } from 'vite'
import { describe, expect, test } from 'vitest'
import type { OutputChunk, RollupOutput } from 'rollup'

describe('vue component library', () => {
  test('should output tree shakeable css module code', async () => {
    // Build lib
    await build({
      logLevel: 'silent',
      configFile: path.resolve(__dirname, '../vite.config.lib.ts')
    })
    // Build app
    const { output } = (await build({
      logLevel: 'silent',
      configFile: path.resolve(__dirname, '../vite.config.consumer.ts')
    })) as RollupOutput
    const { code } = output.find(
      (e) => e.type === 'chunk' && e.isEntry
    ) as OutputChunk
    // Unused css module should be treeshaked
    expect(code).toContain('styleA') // styleA is used by CompA
    expect(code).not.toContain('styleB') // styleB is not used
  })

  test('should inject css when cssCodeSplit = true', async () => {
    // Build lib
    const { output } = (
      await build({
        logLevel: 'silent',
        configFile: path.resolve(__dirname, '../vite.config.lib-css.ts')
      })
    )[0]
    expect(output[0].code).toContain('.card{padding:4rem}')
  })
})
