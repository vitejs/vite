import path from 'node:path'
import { expect, test } from 'vitest'
import { getRolldownDevRuntimeFiles } from '../../plugins/clientInjections'
import { createServer } from '../../server'

// Catch a rolldown layout change here, instead of as a 404 in the browser. The runtime may
// be one file with no imports, or an entry that imports helper files with relative paths.
test('serves every file the rolldown dev runtime imports', () => {
  const files = getRolldownDevRuntimeFiles()
  expect(files.get('@rolldown/experimental-runtime.mjs')).toContain(
    'DevRuntime',
  )
  for (const [urlPath, source] of files) {
    for (const match of source.matchAll(/\bfrom\s*['"](\.\.?\/[^'"]+)['"]/g)) {
      const imported = path.posix.join(path.posix.dirname(urlPath), match[1])
      expect(files.has(imported), `${urlPath} imports ${match[1]}`).toBe(true)
    }
  }
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
