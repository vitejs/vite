// @ts-check
const fs = require('fs')
const path = require('path')
const express = require('express')

const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITE_TEST_BUILD

async function createServer(root = process.cwd(), hmrPort) {
  const resolve = (p) => path.resolve(__dirname, p)

  const app = express()

  /**
   * @type {import('vite').ViteDevServer}
   */
  const vite = await require('vite').createServer({
    root,
    logLevel: isTest ? 'error' : 'info',
    server: {
      middlewareMode: 'ssr',
      hmr: {
        port: hmrPort
      }
    }
  })
  app.use(vite.middlewares)

  app.use('*', async (req, res) => {
    try {
      let template = fs.readFileSync(resolve('index.html'), 'utf-8')
      template = await vite.transformIndexHtml(req.originalUrl, template)

      // `main.js` imports dependencies that are yet to be discovered and optimized, aka "missing" deps.
      // Loading `main.js` in SSR should not trigger optimizing the "missing" deps
      const { name } = await vite.ssrLoadModule('./main.js')

      // Loading `main.js` in the client should trigger optimizing the "missing" deps
      const appHtml = `<div id="app">${name}</div>
<script type='module'>
  import { name } from './main.js'
  document.getElementById('app').innerText = name
</script>`

      const html = template.replace(`<!--app-html-->`, appHtml)

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      vite.ssrFixStacktrace(e)
      console.log(e.stack)
      res.status(500).end(e.stack)
    }
  })

  return { app, vite }
}

if (!isTest) {
  createServer().then(({ app }) =>
    app.listen(5173, () => {
      console.log('http://localhost:5173')
    })
  )
}

// for test use
exports.createServer = createServer
