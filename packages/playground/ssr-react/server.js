// @ts-check
const fs = require('fs')
const path = require('path')
const express = require('express')

const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITE_TEST_BUILD

async function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === 'production'
) {
  const toAbsolute = (p) => path.resolve(__dirname, p)

  const indexProd = isProd
    ? fs.readFileSync(toAbsolute('dist/client/index.html'), 'utf-8')
    : ''

  function getIndexTemplate() {
    if (isProd) {
      return indexProd
    }
    // during dev, inject vite client + always read fresh index.html
    return fs.readFileSync(toAbsolute('index.html'), 'utf-8')
  }

  const app = express()

  /**
   * @type {import('vite').ViteDevServer}
   */
  let vite
  if (!isProd) {
    vite = await require('vite').createServer({
      root,
      logLevel: isTest ? 'error' : 'info',
      server: {
        middlewareMode: true
      }
    })
    // use vite's connect instance as middleware
    app.use(vite.middlewares)
  } else {
    app.use(require('compression')())
    app.use(
      require('serve-static')(toAbsolute('dist/client'), {
        index: false
      })
    )
  }

  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl
      let template = getIndexTemplate()
      if (!isProd) {
        template = await vite.transformIndexHtml(url, template)
      }

      const { render } = isProd
        ? // @ts-ignore
          require('./dist/server/entry-server.js')
        : await vite.ssrLoadModule('/src/entry-server.jsx')

      const context = {}
      const appHtml = render(url, context)

      if (context.url) {
        // Somewhere a `<Redirect>` was rendered
        return res.redirect(301, context.url)
      }

      const html = template.replace(`<!--app-html-->`, appHtml)

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      !isProd && vite.ssrFixStacktrace(e)
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
