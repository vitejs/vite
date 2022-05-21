import { fileURLToPath } from 'url'
import { dirname } from 'path'
import MagicString from 'magic-string'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': __dirname
    }
  },
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      less: {
        additionalData: '@color: red;'
      },
      styl: {
        additionalData: (content, filename) => {
          const ms = new MagicString(content, { filename })

          const willBeReplaced = 'blue-red-mixed'
          const start = content.indexOf(willBeReplaced)
          ms.overwrite(start, start + willBeReplaced.length, 'purple')

          const map = ms.generateMap({ hires: true })
          map.file = filename
          map.sources = [filename]

          return {
            content: ms.toString(),
            map
          }
        }
      }
    }
  },
  build: {
    sourcemap: true
  },
  plugins: [
    {
      name: 'virtual-html',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/virtual.html') {
            const t = await server.transformIndexHtml(
              '/virtual.html',
              '<style> .foo { color: red; } </style> <p class="foo">virtual html</p>'
            )
            res.setHeader('Content-Type', 'text/html')
            res.statusCode = 200
            res.end(t)
            return
          }
          next()
        })
      }
    }
  ]
})
