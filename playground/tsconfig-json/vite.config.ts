import path from 'node:path'
import { defineConfig } from 'vite'
import type { Plugin, ResolvedConfig } from 'vite'

export default defineConfig({
  plugins: [transformCountPlugin()],
})

function transformCountPlugin(): Plugin {
  const counts = new Map<string, number>()
  let root = ''

  return {
    name: 'transform-count',
    configResolved(config: ResolvedConfig) {
      root = config.root
    },
    transform(_code, id) {
      if (
        !id.includes('\0') &&
        !id.includes('node_modules') &&
        /\.[jt]sx?$/.test(id)
      ) {
        const rel = path
          .relative(root, id.split('?')[0])
          .split(path.sep)
          .join('/')
        counts.set(rel, (counts.get(rel) ?? 0) + 1)
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/transform-counts') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(Object.fromEntries(counts)))
          return
        }
        next()
      })
    },
  }
}
