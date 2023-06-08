// @ts-check
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isTest = process.env.VITEST

export async function createServer(root = process.cwd()) {
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
    },
    appType: 'custom',
    json: {
      stringify: true,
    },
  })
  // use vite's connect instance as middleware
  app.use(vite.middlewares)

  app.use('*', async (req, res) => {
    try {
      let [url] = req.originalUrl.split('?')
      if (url.endsWith('/')) url += 'index.ssr.html'

      if (url === '/json-module') {
        console.time('load module')
        const json = JSON.stringify(await vite.ssrLoadModule('/test.json'))
        console.timeEnd('load module')
        res.status(200).end('' + json.length)
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
        res.status(200).end(String(json.code.length))
        return
      }

      const htmlLoc = resolve(`.${url}`)
      let html = fs.readFileSync(htmlLoc, 'utf8')
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
