import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { TestAPI } from 'vitest'
import { afterEach, beforeEach, test } from 'vitest'
import type { ViteRuntime } from 'vite/runtime'
import type { MainThreadRuntimeOptions } from '../mainThreadRuntime'
import type { ViteDevServer } from '../../../server'
import type { InlineConfig } from '../../../config'
import { createServer } from '../../../server'
import { createViteRuntime } from '../mainThreadRuntime'

interface TestClient {
  server: ViteDevServer
  runtime: ViteRuntime
}

export async function createViteRuntimeTester(
  config: InlineConfig = {},
  runtimeConfig: MainThreadRuntimeOptions = {},
): Promise<TestAPI<TestClient>> {
  function waitForWatcher(server: ViteDevServer) {
    return new Promise<void>((resolve) => {
      if ((server.watcher as any)._readyEmitted) {
        resolve()
      } else {
        server.watcher.once('ready', () => resolve())
      }
    })
  }

  beforeEach<TestClient>(async (t) => {
    globalThis.__HMR__ = {}

    t.server = await createServer({
      root: __dirname,
      logLevel: 'error',
      server: {
        middlewareMode: true,
        watch: null,
        ws: false,
      },
      ssr: {
        external: ['@vitejs/cjs-external', '@vitejs/esm-external'],
      },
      optimizeDeps: {
        disabled: true,
        noDiscovery: true,
        include: [],
      },
      plugins: [
        {
          name: 'vite-plugin-virtual',
          resolveId(id) {
            if (id === 'virtual0:test') {
              return `\0virtual:test`
            }
            if (id === 'virtual:test') {
              return 'virtual:test'
            }
          },
          load(id) {
            if (id === `\0virtual:test`) {
              return `export const msg = 'virtual0'`
            }
            if (id === `virtual:test`) {
              return `export const msg = 'virtual'`
            }
          },
        },
      ],
      ...config,
    })
    t.runtime = await createViteRuntime(t.server, {
      hmr: {
        logger: false,
      },
      // don't override by default so Vitest source maps are correct
      sourcemapInterceptor: false,
      ...runtimeConfig,
    })
    if (config.server?.watch) {
      await waitForWatcher(t.server)
    }
  })

  afterEach<TestClient>(async (t) => {
    await t.runtime.destroy()
    await t.server.close()
  })

  return test as TestAPI<TestClient>
}

const originalFiles = new Map<string, string>()
const createdFiles = new Set<string>()
afterEach(() => {
  originalFiles.forEach((content, file) => {
    fs.writeFileSync(file, content, 'utf-8')
  })
  createdFiles.forEach((file) => {
    if (fs.existsSync(file)) fs.unlinkSync(file)
  })
  originalFiles.clear()
  createdFiles.clear()
})

export function createFile(file: string, content: string): void {
  createdFiles.add(file)
  fs.mkdirSync(dirname(file), { recursive: true })
  fs.writeFileSync(file, content, 'utf-8')
}

export function editFile(
  file: string,
  callback: (content: string) => string,
): void {
  const content = fs.readFileSync(file, 'utf-8')
  if (!originalFiles.has(file)) originalFiles.set(file, content)
  fs.writeFileSync(file, callback(content), 'utf-8')
}

export function resolvePath(baseUrl: string, path: string): string {
  const filename = fileURLToPath(baseUrl)
  return resolve(dirname(filename), path).replace(/\\/g, '/')
}
