import { expect, test } from 'vitest'
import type { InlineConfig } from '../../config'
import { getRolldownDevRuntime } from '../../plugins/clientInjections'
import { createServer } from '../../server'

// Only this one file is served, so an import in it would 404 in the browser.
test('the rolldown dev runtime imports nothing', () => {
  const source = getRolldownDevRuntime()
  expect(source).toContain('DevRuntime')
  expect(source).not.toMatch(/^\s*import\b/m)
  expect(source).not.toMatch(/\bfrom\s*['"]/)
})

test('injects displayName into the HMR client', async () => {
  const server = await createServer({
    configFile: false,
    root: import.meta.dirname,
    logLevel: 'silent',
    displayName: 'sitelo',
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, ws: false },
  })
  try {
    const result =
      await server.environments.client.transformRequest('/@vite/client')
    expect(result?.code).not.toContain('__DISPLAY_NAME__')
    expect(result?.code).toContain('const logPrefix = `[${"sitelo"}]`')
  } finally {
    await server.close()
  }
})

async function transformClient(config: InlineConfig) {
  const server = await createServer({
    configFile: false,
    root: import.meta.dirname,
    logLevel: 'silent',
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, ws: false },
    ...config,
  })
  try {
    const result =
      await server.environments.client.transformRequest('/@vite/client')
    return result!.code
  } finally {
    await server.close()
  }
}

test('the overlay tip names vite.config.js by default', async () => {
  const code = await transformClient({})
  expect(code).toContain('const hmrConfigName = "vite.config.js"')
  expect(code).toContain('const hmrOverlayOption = "server.hmr.overlay"')
})

test('the overlay tip names the file and key in configHint', async () => {
  const code = await transformClient({
    configHint: { file: 'my-tool.config.js', key: 'vite' },
  })
  expect(code).toContain('const hmrConfigName = "my-tool.config.js"')
  expect(code).toContain('const hmrOverlayOption = "vite.server.hmr.overlay"')
})
