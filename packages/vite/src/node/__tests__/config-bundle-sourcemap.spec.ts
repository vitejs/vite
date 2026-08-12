import fsp from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, test, vi } from 'vitest'
import { loadConfigFromFile } from '../config'

describe('bundleConfigFile', () => {
  const fixtures = path.resolve(import.meta.dirname, './fixtures/config')

  test('resolves the inline sourcemap source to the absolute config path for a nested config', async () => {
    // VitePress-style layout: the config lives in a nested `.vitepress` dir.
    const configFile = path.resolve(
      fixtures,
      './sourcemap/nested/.vitepress/config.mts',
    )
    const configRoot = path.dirname(path.dirname(configFile))

    // `loadConfigFromBundledFile` writes the bundled code (which embeds the
    // inline sourcemap) to a temp file before importing it. Intercept that
    // write so we can inspect the emitted sourcemap.
    const originalWriteFile = fsp.writeFile
    let bundledCode = ''
    const writeSpy = vi.spyOn(fsp, 'writeFile').mockImplementation(((
      file: unknown,
      data: unknown,
    ) => {
      if (typeof data === 'string') {
        bundledCode = data
      }
      return originalWriteFile.call(fsp, file, data)
    }) as any)

    try {
      const result = await loadConfigFromFile(
        {} as any,
        configFile,
        configRoot,
        undefined,
        undefined,
        'bundle',
      )
      expect(result).not.toBeNull()
    } finally {
      writeSpy.mockRestore()
    }

    const sourceMapMatch = bundledCode.match(/base64,([A-Za-z0-9+/=]+)/)
    expect(
      sourceMapMatch,
      'the bundled config should embed an inline sourcemap',
    ).toBeTruthy()
    const sourceMap = JSON.parse(
      Buffer.from(sourceMapMatch![1], 'base64').toString('utf-8'),
    )
    // The source path must point at the actual config file, not a path
    // nested under it (e.g. `.../.vitepress/.vitepress/config.mts`).
    // `sourceMap.sources` uses `/` separators even on Windows; normalize both
    // sides so the comparison is platform-independent.
    expect(path.normalize(sourceMap.sources[0])).toBe(
      path.normalize(configFile),
    )
  })
})
