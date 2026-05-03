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
  test('does not warn when the source is inside the package', async () => {
    const file = path.posix.resolve(
      'packages/vite/src/node/server/__tests__/fixtures/sourcemap-drive-letter/node_modules/foo/src/index.js',
    )

    const plugin: Plugin = {
      name: 'vite-plugin-test-sourcemap',
      resolveId(id) {
        return id
      },
      load() {
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
      },
    }

    const environment = await createDevEnvironment({ plugins: [plugin] })
    const warnOnce = vi.spyOn(environment.logger, 'warnOnce')

    await transformRequest(environment, '/@fs' + file, { skipFsCheck: false })

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
