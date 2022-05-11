import path from 'path'
import { build } from 'vite'
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
})
