import { build } from 'vite'
import { resolve } from 'path'
import type { OutputChunk, RollupOutput } from 'rollup'

describe('vue component library', () => {
  test('should output tree shakeable css module code', async () => {
    const root = resolve(__dirname, '..')
    const options = { root, logLevel: 'silent' } as const
    // Build lib
    await build({ ...options, configFile: resolve(root, 'vite.config.lib.ts') })
    // Build app
    const { output } = (await build({
      ...options,
      configFile: resolve(root, 'vite.config.consumer.ts')
    })) as RollupOutput
    const { code } = output.find(
      (e) => e.type === 'chunk' && e.isEntry
    ) as OutputChunk
    // Unused css module should be treeshaked
    expect(code).toContain('styleA') // styleA is used by CompA
    expect(code).not.toContain('styleB') // styleB is not used
  })
})
