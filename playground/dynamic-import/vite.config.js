import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'

const dirname = import.meta.dirname

// files that the `@vite-ignore` imports ask for at runtime, so the bundler
// never sees them
const runtimeFiles = ['views/qux.js', 'files/mxd.js', 'files/mxd.json']

export default defineConfig({
  plugins: [
    {
      name: 'copy',
      writeBundle() {
        fs.mkdirSync(path.resolve(dirname, 'dist/views'))
        fs.mkdirSync(path.resolve(dirname, 'dist/files'))
        for (const file of runtimeFiles) {
          fs.copyFileSync(
            path.resolve(dirname, file),
            path.resolve(dirname, 'dist', file),
          )
        }
      },
      // bundled dev serves only the bundle output, so serve these files here,
      // the same way `writeBundle` copies them into `dist` for the build
      configureServer(server) {
        if (!server.config.experimental.bundledDev) return
        server.middlewares.use((req, res, next) => {
          const file = new URL(req.url, 'http://localhost').pathname.slice(1)
          if (!runtimeFiles.includes(file)) return next()
          res.setHeader(
            'Content-Type',
            file.endsWith('.json') ? 'application/json' : 'text/javascript',
          )
          res.end(fs.readFileSync(path.resolve(dirname, file)))
        })
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(dirname, 'alias'),
    },
  },
  build: {
    sourcemap: true,
  },
})
