import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { onTestFinished, test } from 'vitest'
import type { InlineConfig } from '../../../config'
import type { ViteDevServer } from '../../../server'
import { createServer } from '../../../server'
import type { ServerModuleRunnerOptions } from '../serverModuleRunner'
import { createServerModuleRunner } from '../serverModuleRunner'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- infer the fixture context from the builder
export function createModuleRunnerTester(
  config: InlineConfig = {},
  runnerConfig: ServerModuleRunnerOptions = {},
) {
  function waitForWatcher(server: ViteDevServer) {
    return new Promise<void>((resolve) => {
      if ((server.watcher as any)._readyEmitted) {
        resolve()
      } else {
        server.watcher.once('ready', () => resolve())
      }
    })
  }

  return (
    test
      // eslint-disable-next-line no-empty-pattern
      .extend('server', async ({}, { onCleanup }) => {
        // @ts-ignore
        globalThis.__HMR__ = {}

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
        onCleanup(() => server.close())
        return server
      })
      .extend('environment', ({ server }) => server.environments.ssr)
      .extend('runner', async ({ server, environment }, { onCleanup }) => {
        const runner = createServerModuleRunner(environment, {
          hmr: {
            logger: false,
          },
          // don't override by default so Vitest source maps are correct
          sourcemapInterceptor: false,
          ...runnerConfig,
        })
        onCleanup(() => runner.close())
        if (config.server?.watch) {
          await waitForWatcher(server)
        }
        return runner
      })
  )
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
