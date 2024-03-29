import { fileURLToPath } from 'node:url'
import {
  type Connect,
  type Plugin,
  type PluginOption,
  createNodeDevEnvironment,
  createServerModuleRunner,
  defineConfig,
} from 'vite'

export default defineConfig((env) => ({
  clearScreen: false,
  appType: 'custom',
  plugins: [
    vitePluginSsrMiddleware({
      entry: '/src/entry-server',
      preview: fileURLToPath(
        new URL('./dist/server/index.js', import.meta.url),
      ),
    }),
    {
      name: 'global-server',
      configureServer(server) {
        Object.assign(globalThis, { __globalServer: server })
      },
    },
  ],
  // [feedback] no automatic process.env.NODE_ENV replacement applied for build?
  define:
    env.command === 'build'
      ? {
          'process.env.NODE_ENV': `"production"`,
        }
      : {},
  environments: {
    client: {
      build: {
        minify: false,
        sourcemap: true,
        outDir: 'dist/client',
      },
    },
    ssr: {
      dev: {
        createEnvironment: createNodeDevEnvironment,
      },
      build: {
        outDir: 'dist/server',
        // [feedback]
        // is this still meant to be used?
        // for example, `ssr: true` seems to make `minify: false` automatically
        // and also externalization.
        ssr: true,
        rollupOptions: {
          input: {
            index: '/src/entry-server',
          },
        },
      },
    },
  },

  // [feedback] should preview automatically pick up environments.client.build.outDir?
  build: env.isPreview ? { outDir: 'dist/client' } : {},

  builder: {
    runBuildTasks: async (_builder, buildTasks) => {
      for (const task of buildTasks) {
        await task.run()
      }
    },
  },
}))

// vavite-style ssr middleware plugin
export function vitePluginSsrMiddleware({
  entry,
  preview,
}: {
  entry: string
  preview?: string
}): PluginOption {
  const plugin: Plugin = {
    name: vitePluginSsrMiddleware.name,

    configureServer(server) {
      const runner = createServerModuleRunner(server.environments.ssr)
      const handler: Connect.NextHandleFunction = async (req, res, next) => {
        try {
          const mod = await runner.import(entry)
          await mod['default'](req, res, next)
        } catch (e) {
          next(e)
        }
      }
      return () => server.middlewares.use(handler)
    },

    async configurePreviewServer(server) {
      if (preview) {
        const mod = await import(preview)
        return () => server.middlewares.use(mod.default)
      }
      return
    },
  }
  return [plugin]
}
