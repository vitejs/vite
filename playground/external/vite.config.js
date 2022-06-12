module.exports = {
  build: {
    rollupOptions: {
      external: ['external-dep']
    }
  },
  plugins: [serveExternalDep()]
}

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
