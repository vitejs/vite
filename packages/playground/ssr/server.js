// @ts-check
const fs = require('fs')
const express = require('express')
const { createServer } = require('vite')

const isProd = process.env.NODE_ENV === 'production'

const indexTemplateProd = isProd
  ? fs.readFileSync('dist/client/index.html', 'utf-8')
  : ''

const manifest = isProd
  ? // @ts-ignore
    require('./dist/client/ssr-manifest.json')
  : {}

function getIndexTemplate() {
  return isProd
    ? indexTemplateProd
    : `<script type="module" src="/@vite/client"></script>` +
        fs.readFileSync('index.html', 'utf-8')
}

async function startServer() {
  const app = express()

  /**
   * @type {import('vite').ViteDevServer}
   */
  let vite
  if (!isProd) {
    vite = await createServer({
      server: {
        middlewareMode: true
      }
    })
    // use vite's connect instance as middleware
    app.use(vite.middlewares)
  } else {
    app.use(require('compression')())
    app.use(require('serve-static')('dist/client', { index: false }))
  }

  app.use('*', async (req, res, next) => {
    try {
      const { render } = isProd
        ? // @ts-ignore
          require('./dist/server/entry-server.js')
        : await vite.ssrLoadModule('/src/entry-server.ts')

      const [appHtml, preloadLinks] = await render(req.originalUrl, manifest)

      const html = `
      ${preloadLinks}
      ${getIndexTemplate().replace(`<!--ssr-outlet-->`, appHtml)}
      `

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      !isProd && vite.ssrFixStacktrace(e)
      console.log(e.stack)
      next(e)
    }
  })

  app.listen(3000, () => {
    console.log('http://localhost:3000')
  })
}

startServer()
