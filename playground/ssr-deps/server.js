// @ts-check
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const isTest = process.env.VITEST

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
    ssr: {
      noExternal: [
        '@vitejs/test-no-external-cjs',
        '@vitejs/test-import-builtin-cjs',
        '@vitejs/test-no-external-css',
        '@vitejs/test-external-entry',
      ],
      external: [
        '@vitejs/test-nested-external',
        '@vitejs/test-external-entry/entry',
      ],
      optimizeDeps: {
        disabled: 'build',
      },
    },
    plugins: [
      {
        name: 'dep-virtual',
        enforce: 'pre',
        resolveId(id) {
          if (id === '@vitejs/test-pkg-exports/virtual') {
            return '@vitejs/test-pkg-exports/virtual'
          }
        },
        load(id) {
          if (id === '@vitejs/test-pkg-exports/virtual') {
            return 'export default "[success]"'
          }
        },
      },
      {
        name: 'virtual-isomorphic-module',
        resolveId(id) {
          if (id === 'virtual:isomorphic-module') {
            return '\0virtual:isomorphic-module'
          }
        },
        load(id, { ssr }) {
          if (id === '\0virtual:isomorphic-module') {
            if (ssr) {
              return 'export { default } from "/src/isomorphic-module-server.js";'
            } else {
              return 'export { default } from "/src/isomorphic-module-browser.js";'
            }
          }
        },
      },
    ],
  })
  // use vite's connect instance as middleware
  app.use((req, res, next) => {
    vite.middlewares.handle(req, res, next)
  })

  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl

      let template
      template = fs.readFileSync(resolve('index.html'), 'utf-8')
      template = await vite.transformIndexHtml(url, template)
      const render = (await vite.ssrLoadModule('/src/app.js')).render

      const appHtml = await render(url, __dirname)

      const html = template.replace(`<!--app-html-->`, appHtml)

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
