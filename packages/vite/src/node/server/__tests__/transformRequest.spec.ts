import path from 'node:path'
import { describe, expect, test, vi } from 'vitest'
import { type UserConfig, resolveConfig } from '../../config'
import type { Plugin } from '../../plugin'
import { DevEnvironment } from '../environment'
import { getModuleTypeFromId, transformRequest } from '../transformRequest'

describe('getModuleTypeFromId', () => {
  const testCases = [
    { id: 'foo.js', expected: 'js' },
    { id: 'foo.ts', expected: 'ts' },
    { id: 'foo.a.js', expected: 'js' },
    { id: '', expected: undefined },
  ]

  for (const { id, expected } of testCases) {
    test(`should return ${expected} for id: ${id}`, () => {
      const result = getModuleTypeFromId(id)
      expect(result).toBe(expected)
    })
  }
})

describe('injectSourcesContent', () => {
  // This test covers the Windows-specific bug where packageRoot is derived from
  // a module id that lacks a drive letter (e.g. /Users/…/node_modules/foo) while
  // path.resolve prepends the CWD drive letter to the resolved source path
  // (C:/Users/…/node_modules/foo/src/index.ts). Without the fix, isParentDirectory
  // returns false and a spurious "outside its package" warning fires.
  //
  // On Windows: we strip the drive letter from the absolute fixture path to
  // reproduce the bug scenario — path.resolve and fsp.realpath restore it so
  // the files are found on disk without any mocking.
  // On other platforms: the full path is used, validating the same happy-path
  // assertion (no warning for a legitimate in-package source).
  test('does not warn when the source is inside the package', async () => {
    const file = path.posix.resolve(
      import.meta.dirname,
      'fixtures/sourcemap-drive-letter/node_modules/foo/dist/index.js',
    )

    const plugin: Plugin = {
      name: 'test-pkg',
      resolveId(id) {
        if (id === file) return id
      },
      load(id) {
        if (id === file) {
          return {
            code: 'export default 1',
            map: {
              version: 3,
              file,
              sources: ['index.js'],
              mappings: 'AAAA',
              sourcesContent: [null],
            },
          }
        }
      },
    }

    const environment = await createDevEnvironment({ plugins: [plugin] })
    const warnOnce = vi.spyOn(environment.logger, 'warnOnce')

    await transformRequest(environment, file, { skipFsCheck: false })

    expect(warnOnce).not.toHaveBeenCalledWith(
      expect.stringContaining('outside its package'),
    )

    await environment.close()
  })
})

async function createDevEnvironment(
  inlineConfig?: UserConfig,
): Promise<DevEnvironment> {
  const config = await resolveConfig(
    { configFile: false, ...inlineConfig },
    'serve',
  )
  // @ts-expect-error This plugin requires a ViteDevServer instance.
  config.plugins = config.plugins.filter((p) => !p.name.includes('pre-alias'))
  const environment = new DevEnvironment('client', config, { hot: true })
  await environment.init()
  return environment
}
