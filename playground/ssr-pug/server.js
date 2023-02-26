// @ts-check
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pug from 'pug'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const isTest = process.env.VITEST

const DYNAMIC_SCRIPTS = `
  <script type="module">
    const p = document.createElement('p');
    p.innerHTML = '✅ Dynamically injected inline script';
    document.body.appendChild(p);
  </script>
  <script type="module" src="/src/app.js"></script>
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

  app.use('*', async (req, res) => {
    try {
      let [url] = req.originalUrl.split('?')
      url = url.replace(/\.html$/, '.pug')
      if (url.endsWith('/')) url += 'index.pug'

      const htmlLoc = resolve(`.${url}`)
      let html = pug.renderFile(htmlLoc)
      html = html.replace('</body>', `${DYNAMIC_SCRIPTS}</body>`)
      html = await vite.transformIndexHtml(url, html)

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
    }),
  )
}
