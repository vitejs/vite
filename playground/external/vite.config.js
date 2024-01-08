import fs from 'node:fs/promises'
import { defineConfig } from 'vite'

const npmDirectServeConfig = {
  '/vue@3.2.0.js': 'vue32/dist/vue.runtime.esm-browser.js',
  '/slash@5.js': 'slash5/index.js',
}
/** @type {import('vite').Connect.NextHandleFunction} */
const serveNpmCodeDirectlyMiddleware = async (req, res, next) => {
  for (const [url, file] of Object.entries(npmDirectServeConfig)) {
    if (req.originalUrl === url) {
      const code = await fs.readFile(
        new URL(`./node_modules/${file}`, import.meta.url),
      )
      res.setHeader('Content-Type', 'text/javascript')
      res.end(code)
      return
    }
  }
  next()
}

export default defineConfig({
  optimizeDeps: {
    include: ['dep-that-imports', 'dep-that-requires'],
    exclude: ['vue', 'slash5'],
  },
  build: {
    minify: false,
    rollupOptions: {
      external: ['vue', 'slash3', 'slash5'],
    },
    commonjsOptions: {
      esmExternals: ['vue', 'slash5'],
    },
  },
  plugins: [
    {
      name: 'serve-npm-code-directly',
      configureServer({ middlewares }) {
        middlewares.use(serveNpmCodeDirectlyMiddleware)
      },
      configurePreviewServer({ middlewares }) {
        middlewares.use(serveNpmCodeDirectlyMiddleware)
      },
    },
  ],
})
