import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test as base, onTestFinished } from 'vitest'
import type { ModuleRunner } from 'vite/module-runner'
// import type { ServerModuleRunnerOptions } from '../serverModuleRunner'
import type { ViteDevServer } from '../../../server'
import type { InlineConfig } from '../../../config'
import { createServer } from '../../../server'
// import { createServerModuleRunner } from '../serverModuleRunner'
// import type { DevEnvironment } from '../../../server/environment'
// import type { RunnableDevEnvironment } from '../../..'
import type { FullBundleRunnableDevEnvironment } from '../../../server/environments/fullBundleRunnableEnvironment'

interface TestClient {
  config: InlineConfig
  server: ViteDevServer
  runner: ModuleRunner
  environment: FullBundleRunnableDevEnvironment
}

export const runnerTest = base.extend<TestClient>({
  // eslint-disable-next-line no-empty-pattern
  config: async ({}, use) => {
    await use({})
  },
  server: async ({ config }, use) => {
    const server = await createServer({
      root: import.meta.dirname,
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
            if (id === 'virtual:normal') {
              return '\0' + id
            }
          },
          load(id) {
            if (id === `\0virtual:test`) {
              return `export const msg = 'virtual0'`
            }
            if (id === `virtual:test`) {
              return `export const msg = 'virtual'`
            }
            if (id === '\0virtual:normal') {
              return 'export default "ok"'
            }
          },
        },
        ...(config.plugins ?? []),
      ],
      ...config,
    })
    if (config.server?.watch) {
      await waitForWatcher(server)
    }
    await use(server)
    await server.close()
  },
  environment: async ({ server }, use) => {
    await use(server.environments.ssr as FullBundleRunnableDevEnvironment)
  },
  runner: async ({ environment }, use) => {
    await use(environment.runner)
  },
})

function waitForWatcher(server: ViteDevServer) {
  return new Promise<void>((resolve) => {
    if ((server.watcher as any)._readyEmitted) {
      resolve()
    } else {
      server.watcher.once('ready', () => resolve())
    }
  })
}

type FixtureEditor = {
  editFile: (file: string, callback: (content: string) => string) => void
}

export function createFixtureEditor(): FixtureEditor {
  const originalFiles = new Map<string, string>()
  onTestFinished(() => {
    originalFiles.forEach((content, file) => {
      fs.writeFileSync(file, content, 'utf-8')
    })
    originalFiles.clear()
  })

  return {
    editFile(file, callback) {
      const content = fs.readFileSync(file, 'utf-8')
      if (!originalFiles.has(file)) originalFiles.set(file, content)
      fs.writeFileSync(file, callback(content), 'utf-8')
    },
  }
}

export function resolvePath(baseUrl: string, path: string): string {
  const filename = fileURLToPath(baseUrl)
  return resolve(dirname(filename), path).replace(/\\/g, '/')
}
