import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import type { Plugin } from '../../plugin'
import { type ViteDevServer, createServer } from '../index'

const root = fileURLToPath(new URL('./fixtures/load-meta', import.meta.url))

describe('load hook meta', () => {
  let server: ViteDevServer | undefined

  afterEach(async () => {
    await server?.close()
    server = undefined
  })

  it('is available to later hooks in the dev client pipeline', async () => {
    const plugin: Plugin = {
      name: 'test-load-meta',
      enforce: 'pre',
      load(id) {
        if (id.endsWith('probe.js')) {
          return { code: 'export default 1', meta: { probe: 'from-load' } }
        }
      },
      transform(code, id) {
        if (id.endsWith('probe.js')) {
          const meta = this.getModuleInfo(id)?.meta
          return {
            code: `${code}\nexport const seenByTransform = ${JSON.stringify(meta?.probe ?? null)}`,
            map: null,
          }
        }
      },
    }

    server = await createServer({
      configFile: false,
      root,
      logLevel: 'silent',
      server: { middlewareMode: true },
      plugins: [plugin],
    })

    const result = await server.transformRequest('/probe.js')
    expect(result?.code).toContain('export const seenByTransform = "from-load"')
  })
})
