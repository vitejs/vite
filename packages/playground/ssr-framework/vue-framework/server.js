const express = require('express')
const { createPageRender } = require('./createPageRender.js')
const { getViteConfig } = require('./getViteConfig.js')
const vite = require('vite')

module.exports.startServer = startServer

async function startServer(root, port, isProduction) {
  const app = express()

  let viteServer
  if (isProduction) {
    app.use(express.static(`${root}/dist/client`, { index: false }))
  } else {
    viteServer = await vite.createServer({
      ...getViteConfig(root),
      logLevel: 'warn',
      optimizeDeps: { entries: ['**/pages/*.vue'] },
      server: { middlewareMode: true }
    })
    app.use(viteServer.middlewares)
  }

  const renderPage = createPageRender(viteServer, root, isProduction)
  app.get('*', async (req, res, next) => {
    const url = req.originalUrl
    const html = await renderPage(url)
    if (html === null) return next()
    res.send(html)
  })

  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      const stopServer = async () => {
        server.close()
        if (viteServer) await viteServer.close()
      }
      resolve(stopServer)
    })
  })
}
