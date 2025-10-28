import fs from 'node:fs/promises'
import path from 'node:path'
import { type Connect, defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist/nested',
    rollupOptions: {
      preserveEntrySignatures: 'strict',
      input: {
        plugin: path.resolve(import.meta.dirname, './index.ts'),
      },
      output: {
        // @ts-expect-error AMD is not supported (https://github.com/rolldown/rolldown/issues/2528)
        format: 'amd',
        entryFileNames: 'assets/[name].js',
      },
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
  appType: 'mpa', // to cause 404 for incorrect URLs
})

const npmDirectServeConfig = {
  '/npm/requirejs.js': 'requirejs/require.js',
}
const serveNpmCodeDirectlyMiddleware: Connect.NextHandleFunction = async (
  req,
  res,
  next,
) => {
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
