import path from 'path'
import { fileURLToPath } from 'url'

import { install } from 'source-map-support'
install()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const vite = await import('vite')
const server = await vite.createServer({
  root: path.join(__dirname, 'app'),
  // mode: 'production',
  ssr: {
    external: ['cjs-package', 'esm-package']
  },
  server: {
    middlewareMode: 'ssr'
  }
})

const entryModule = await server.ssrLoadModule('/entry-server.jsx')
console.log(entryModule.default)
