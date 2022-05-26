import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITE_TEST_BUILD

const DYNAMIC_SCRIPTS = `
  <script type="module">
    const p = document.createElement('p');
    p.innerHTML = '✅ Dynamically injected inline script';
    document.body.appendChild(p);
  </script>
  <script type="module" src="/src/app.js"></script>
`

const DYNAMIC_STYLES = `
  <style>
  h1 {
    background-color: blue;
  }
  </style>
`

export async function createServer(root = process.cwd(), hmrPort) {
  const resolve = (p) => path.resolve(__dirname, p)

  const app = express()

  /**
   * @type {import('vite').ViteDevServer}
   */
  const vite = await (
    await import('vite')
  ).createServer({
    root,
    logLevel: isTest ? 'error' : 'info',
    server: {
      middlewareMode: 'ssr',
      watch: {
        // During tests we edit the files too fast and sometimes chokidar
        // misses change events, so enforce polling for consistency
        usePolling: true,
        interval: 100
      },
      hmr: {
        port: hmrPort
      }
    }
  })
  // use vite's connect instance as middleware
  app.use(vite.middlewares)

  app.use('*', async (req, res, next) => {
    try {
      let [url] = req.originalUrl.split('?')
      if (url.endsWith('/')) url += 'index.html'

      if (url.startsWith('/favicon.ico')) {
        return res.status(404).end('404')
      }
      if (url.startsWith('/@id/__x00__')) {
        return next()
      }

      const htmlLoc = resolve(`.${url}`)
      let template = fs.readFileSync(htmlLoc, 'utf-8')

      template = template.replace(
        '</body>',
        `${DYNAMIC_SCRIPTS}${DYNAMIC_STYLES}</body>`
      )

      // Force calling transformIndexHtml with url === '/', to simulate
      // usage by ecosystem that was recommended in the SSR documentation
      // as `const url = req.originalUrl`
      const html = await vite.transformIndexHtml('/', template)

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      vite && vite.ssrFixStacktrace(e)
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
