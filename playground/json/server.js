// @ts-check
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isTest = process.env.VITEST

export async function createServer(root = process.cwd(), hmrPort) {
  const resolve = (p) => path.resolve(__dirname, p)

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
    json: {
      stringify: true,
    },
  })

  const app = vite.middlewares

  app.use('*', async (req, res) => {
    try {
      let [url] = req.originalUrl.split('?')
      if (url.endsWith('/')) url += 'index.ssr.html'

      if (url === '/json-module') {
        console.time('load module')
        const json = JSON.stringify(await vite.ssrLoadModule('/test.json'))
        console.timeEnd('load module')
        res.statusCode = 200
        res.end('' + json.length)
        return
      }

      if (url === '/json-fs') {
        // console.time('transform module')
        const source = fs.readFileSync(path.resolve(__dirname, './test.json'), {
          encoding: 'utf-8',
        })
        const json = await vite.ssrTransform(
          `export default ${source}`,
          null,
          './output.json',
        )
        // console.timeEnd('transform module')
        // @ts-expect-error ignore in test
        res.statusCode = 200
        res.end(String(json.code.length))
        return
      }

      const htmlLoc = resolve(`.${url}`)
      let html = fs.readFileSync(htmlLoc, 'utf-8')
      html = await vite.transformIndexHtml(url, html)

      res.statusCode = 200
      res.setHeader('Content-Type', 'text/html')
      res.end(html)
    } catch (e) {
      vite && vite.ssrFixStacktrace(e)
      console.log(e.stack)
      res.statusCode = 500
      res.end(e.stack)
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
