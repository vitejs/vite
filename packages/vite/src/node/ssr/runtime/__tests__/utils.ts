import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test as base, onTestFinished } from 'vitest'
import type { ModuleRunner } from 'vite/module-runner'
import type { ViteDevServer } from '../../../server'
import type { InlineConfig } from '../../../config'
import { createServer } from '../../../server'
import type { RunnableDevEnvironment } from '../../../server/environments/runnableEnvironment'
import {
  type ServerModuleRunnerOptions,
  createServerModuleRunner,
} from '../serverModuleRunner'

interface TestClient {
  fullBundle: string[]
  config: InlineConfig
  server: ViteDevServer
  runner: ModuleRunner
  runnerOptions: ServerModuleRunnerOptions | undefined
  environment: RunnableDevEnvironment
}

export const runnerTest = base.extend<TestClient>({
  // eslint-disable-next-line no-empty-pattern
  fullBundle: ({}, use) => use([]),
  // eslint-disable-next-line no-empty-pattern
  runnerOptions: ({}, use) => use(undefined),
  // eslint-disable-next-line no-empty-pattern
  config: ({}, use) => use({}),
  server: async ({ config, fullBundle }, use) => {
    const server = await createServer({
      configFile: false,
      root: import.meta.dirname,
      logLevel: 'error',
      ssr: {
        external: ['@vitejs/cjs-external', '@vitejs/esm-external'],
      },
      experimental: {
        ssrBundledDev: fullBundle.length > 0,
        ...config.experimental,
      },
      build: {
        rolldownOptions: {
          input: fullBundle,
          ...config.build?.rolldownOptions,
        },
        ...config.build,
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
      server: {
        middlewareMode: true,
        watch: null,
        ws: false,
        hmr: false,
        ...config.server,
      },
    })
    if (config.server?.watch) {
      await waitForWatcher(server)
    }
    await use(server)
    await server.close()
  },
  environment: async ({ server }, use) => {
    await use(server.environments.ssr as RunnableDevEnvironment)
  },
  runner: async ({ environment, runnerOptions }, use) => {
    if (runnerOptions) {
      const runner = createServerModuleRunner(environment, runnerOptions)
      await use(runner)
      await runner.close()
    } else {
      await use(environment.runner)
    }
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
