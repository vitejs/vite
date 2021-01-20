// @ts-check
const fs = require('fs')
const express = require('express')

const isProd = process.env.NODE_ENV === 'production'

const indexProd = isProd
  ? fs.readFileSync('dist/client/index.html', 'utf-8')
  : ''

const manifest = isProd
  ? // @ts-ignore
    require('./dist/client/ssr-manifest.json')
  : {}

function getIndexTemplate(url) {
  if (isProd) {
    return indexProd
  }

  // TODO handle plugin indexHtmlTransforms?
  const reactPreamble = url.startsWith('/react')
    ? `<script type="module">${
        require('@vitejs/plugin-react-refresh').preambleCode
      }</script>`
    : ''

  // during dev, inject vite client + always read fresh index.html
  return (
    `<script type="module" src="/@vite/client"></script>` +
    reactPreamble +
    fs.readFileSync('index.html', 'utf-8')
  )
}

async function startServer() {
  const app = express()

  /**
   * @type {import('vite').ViteDevServer}
   */
  let vite
  if (!isProd) {
    vite = await require('vite').createServer({
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
      ${getIndexTemplate(req.originalUrl).replace(`<!--ssr-outlet-->`, appHtml)}
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
