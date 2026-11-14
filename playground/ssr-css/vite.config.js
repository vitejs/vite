import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  appType: 'custom',
  plugins: [
    {
      name: 'ssr-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          try {
            const { default: render } =
              await server.ssrLoadModule('/entry-server.js')
            render(req, res, next)
          } catch (error) {
            next(error)
          }
        })
      },
      async configurePreviewServer(server) {
        const { default: render } = await import(
          new URL('./dist/ssr/entry-server.js', import.meta.url).href
        )
        server.middlewares.use(render)
      },
    },
  ],
  builder: {},
  environments: {
    ssr: {
      build: {
        outDir: 'dist/ssr',
        rolldownOptions: {
          input: path.join(import.meta.dirname, 'entry-server.js'),
        },
      },
    },
  },
})
