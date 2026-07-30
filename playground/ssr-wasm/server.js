import express from 'express'

const isTest = process.env.VITEST
const isProduction = process.env.NODE_ENV === 'production'

export async function createServer(root = process.cwd(), hmrPort) {
  const app = express()

  /** @type {import('vite').ViteDevServer} */
  let vite
  if (!isProduction) {
    vite = await (
      await import('vite')
    ).createServer({
      root,
      logLevel: isTest ? 'error' : 'info',
      server: {
        middlewareMode: true,
        watch: {
          // During tests we edit the files too fast and sometimes chokidar
          // misses change events, so enforce polling for consistency
          usePolling: true,
          interval: 100,
        },
        hmr: {
          port: hmrPort,
        },
      },
      appType: 'custom',
    })
    // use vite's connect instance as middleware
    app.use(vite.middlewares)
  }

  app.use('*all', async (req, res, next) => {
    try {
      const url = req.originalUrl
      const render = isProduction
        ? (await import('./dist/app.js')).render
        : (await vite.ssrLoadModule('/src/app.js')).render
      const html = await render(url)
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      vite?.ssrFixStacktrace(e)
      if (isTest) throw e
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
    }),
  )
}
