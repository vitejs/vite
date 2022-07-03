import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [serveExternalDep()],
  build: {
    minify: false,
    rollupOptions: {
      external: ['vue', 'external-dep']
    },
    commonjsOptions: {
      esmExternals: ['vue']
    }
  }
})

function serveExternalDep() {
  const middleware = (req, res, next) => {
    if (req.url === 'external-dep') {
      res.header['Content-Type'] = 'application/javascript'
      res.send('export const hello = "vite"')
    } else {
      next()
    }
  }
  return {
    name: 'vite-plugin-external-dep',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    }
  }
}
