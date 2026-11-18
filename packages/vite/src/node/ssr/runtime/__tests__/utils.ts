import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test as base, onTestFinished } from 'vitest'
import type { InlineConfig } from '../../../config'
import type { ViteDevServer } from '../../../server'
import { createServer } from '../../../server'
import type { RunnableDevEnvironment } from '../../../server/environments/runnableEnvironment'
import {
  type ServerModuleRunnerOptions,
  createServerModuleRunner,
} from '../serverModuleRunner'

export const runnerTest = base
  .extend('fullBundle', [] as string[])
  .extend('runnerOptions', undefined as ServerModuleRunnerOptions | undefined)
  .extend('config', {} as InlineConfig)
  .extend('server', async ({ config, fullBundle }, { onCleanup }) => {
    const server = await createServer({
      configFile: false,
      root: import.meta.dirname,
      logLevel: 'error',
      ssr: {
        external: ['@vitejs/cjs-external', '@vitejs/esm-external'],
      },
      environments: {
        ssr: {
          isBundled: fullBundle.length > 0,
        },
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
    onCleanup(() => server.close())
    if (config.server?.watch) {
      await waitForWatcher(server)
    }
    return server
  })
  .extend(
    'environment',
    ({ server }) => server.environments.ssr as RunnableDevEnvironment,
  )
  .extend('runner', ({ environment, runnerOptions }, { onCleanup }) => {
    if (runnerOptions) {
      const runner = createServerModuleRunner(environment, runnerOptions)
      onCleanup(() => runner.close())
      return runner
    }
    return environment.runner
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
