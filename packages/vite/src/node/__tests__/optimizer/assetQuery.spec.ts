import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { expect, test } from 'vitest'
import { createServer } from '../..'

test.each(['module', 'commonjs'])(
  'preserves asset queries in optimized %s dependencies',
  async (type) => {
    const root = fs.mkdtempSync(
      path.join(fs.realpathSync(os.tmpdir()), 'vite-optimized-asset-query-'),
    )
    try {
      const depDir = path.join(
        root,
        'node_modules',
        '@vitejs/test-asset-query-dep',
      )
      fs.mkdirSync(depDir, { recursive: true })
      fs.writeFileSync(
        path.join(depDir, 'package.json'),
        JSON.stringify({
          name: '@vitejs/test-asset-query-dep',
          type,
          main: 'index.js',
        }),
      )
      fs.writeFileSync(
        path.join(depDir, 'data.json'),
        '{"marker":"plain-json"}',
      )
      fs.writeFileSync(path.join(depDir, 'script.js'), 'export default 42')
      fs.writeFileSync(
        path.join(depDir, 'index.js'),
        type === 'module'
          ? `import url from './data.json?url';
             import raw from './data.json?raw';
             import data from './data.json';
             import scriptUrl from './script.js?url';
             import scriptRaw from './script.js?raw';
             export { url, raw, data, scriptUrl, scriptRaw };`
          : `exports.url = require('./data.json?url');
             exports.raw = require('./data.json?raw');
             exports.data = require('./data.json');
             exports.scriptUrl = require('./script.js?url');
             exports.scriptRaw = require('./script.js?raw');`,
      )

      const server = await createServer({
        configFile: false,
        root,
        cacheDir: path.join(root, '.vite'),
        logLevel: 'silent',
        optimizeDeps: {
          force: true,
          noDiscovery: true,
          include: ['@vitejs/test-asset-query-dep'],
        },
        server: { middlewareMode: true, watch: null, ws: false },
      })
      try {
        const optimized =
          server.environments.client.depsOptimizer!.metadata.optimized[
            '@vitejs/test-asset-query-dep'
          ]
        const code = fs.readFileSync(optimized.file, 'utf8')
        expect(code).toMatch(/from\s*["'][^"']*data\.json\?url["']/)
        expect(code).toMatch(/from\s*["'][^"']*data\.json\?raw["']/)
        expect(code).toMatch(/from\s*["'][^"']*script\.js\?url["']/)
        expect(code).toMatch(/from\s*["'][^"']*script\.js\?raw["']/)
        expect(code).toContain('plain-json')

        const url = await server.transformRequest(
          '/node_modules/@vitejs/test-asset-query-dep/data.json?url',
        )
        expect(url?.code).toContain(
          '"/node_modules/@vitejs/test-asset-query-dep/data.json"',
        )
        const raw = await server.transformRequest(
          '/node_modules/@vitejs/test-asset-query-dep/data.json?raw',
        )
        expect(raw?.code).toContain(
          'export default "{\\"marker\\":\\"plain-json\\"}"',
        )
      } finally {
        await server.close()
      }
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  },
)
