import { createServer, defineConfig } from 'vite'
import createOtherAppViteConfig from './other-app/create-vite-config'

const port = 9616

/**
 * @type {() => import('vite').PluginOption}
 * @returns
 */
function addOtherApp() {
  return {
    name: 'vite-plugin-add-other-app',
    async configureServer(viteDevServer) {
      const otherAppConfig = createOtherAppViteConfig()

      /**
       * @type {import('vite').InlineConfig['server']['middlewareMode']}
       */
      const middlewareMode = {
        server: viteDevServer.httpServer,
      }

      /**
       * @type {import('vite').InlineConfig['server']['hmr']}
       */
      const hmr = {
        port,
        server: viteDevServer.httpServer,
      }

      const extendedOtherAppConfig = {
        ...otherAppConfig,
        base: '/anotherApp',
        server: {
          ...(otherAppConfig.server || {}),
          middlewareMode,
          hmr,
        },
      }
      const otherAppServer = await createServer(extendedOtherAppConfig)
      viteDevServer.httpServer.on('close', () => {
        otherAppServer.close()
      })
      viteDevServer.middlewares.use('/anotherApp', otherAppServer.middlewares)
    },
  }
}

export default defineConfig(() => {
  return {
    server: {
      port,
      strictPort: true,
    },
    plugins: [addOtherApp()],
  }
})
