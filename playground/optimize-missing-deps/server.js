// @ts-check
const fs = require('fs')
const path = require('path')
const express = require('express')

const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITE_TEST_BUILD

async function createServer(root = process.cwd()) {
  const resolve = (p) => path.resolve(__dirname, p)

  const app = express()

  /**
   * @type {import('vite').ViteDevServer}
   */
  const vite = await require('vite').createServer({
    root,
    logLevel: isTest ? 'error' : 'info',
    server: { middlewareMode: 'ssr' }
  })
  app.use(vite.middlewares)

  app.use('*', async (req, res) => {
    try {
      let template = fs.readFileSync(resolve('index.html'), 'utf-8')
      template = await vite.transformIndexHtml(req.originalUrl, template)

      // this will import missing deps nest built-in deps that should not be optimized
      const { name } = await vite.ssrLoadModule('./main.js')

      // this will import missing deps that should be optimized correctly
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
    app.listen(3000, () => {
      console.log('http://localhost:3000')
    })
  )
}

// for test use
exports.createServer = createServer
