import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { createServer, resolveConfig } from '..'
import type { ViteDevServer } from '..'
import { normalizePath } from '../utils'

describe('resolveBuildEnvironmentOptions in dev', () => {
  test('build.rollupOptions should not have input in lib', async () => {
    const config = await resolveConfig(
      {
        build: {
          lib: {
            entry: './index.js',
          },
        },
      },
      'serve',
    )

    expect(config.build.rollupOptions).not.toHaveProperty('input')
  })
})

describe('the dev server', () => {
  let server: ViteDevServer

  afterEach(async () => {
    await server?.close()
  })

  test('does not mark unresolved SSR imports as safe', async () => {
    const root = path.join(import.meta.dirname, 'fixtures', 'input-option')
    const entry = normalizePath(path.join(root, 'unresolved-entry.js'))
    const unresolvedImport = '/safe-module-path-unresolved'

    server = await createServer({
      configFile: false,
      root,
      optimizeDeps: { noDiscovery: true },
      server: { middlewareMode: true, ws: false },
      plugins: [
        {
          name: 'unresolved-ssr-import',
          resolveId(id) {
            if (id === '/unresolved-entry.js') return entry
          },
          load(id) {
            if (id === entry)
              return `import ${JSON.stringify(unresolvedImport)}`
          },
        },
      ],
    })

    await server.environments.ssr.transformRequest('/unresolved-entry.js')

    expect(server.config.safeModulePaths).not.toContain(unresolvedImport)
  })
})
