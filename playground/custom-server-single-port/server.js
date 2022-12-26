// @ts-check
const http = require('node:http')
const express = require('express')

const isTest = process.env.VITEST

async function createServer(root = process.cwd()) {
  const app = express()
  const server = http.createServer(app)

  /**
   * @type {import('vite').ViteDevServer}
   */
  const vite = await require('vite').createServer({
    root,
    logLevel: isTest ? 'error' : 'info',
    server: {
      middlewareMode: true,
      hmr: {
        server,
      },
    },
    appType: 'custom',
  })
  app.use(vite.middlewares)

  app.use('*', async (req, res) => {
    try {
      const html = await vite.transformIndexHtml(
        req.originalUrl,
        '<div>Testing HMR using custom server to share WebSocket connection with the main server so that web browser only need to use the single port</div>',
      )
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      vite.ssrFixStacktrace(e)
      console.log(e.stack)
      res.status(500).end(e.stack)
    }
  })

  return { server, vite }
}

if (!isTest) {
  createServer().then(({ server }) =>
    server.listen(8744, () => {
      console.log('http://localhost:8744')
    }),
  )
}

// for test use
exports.createServer = createServer
