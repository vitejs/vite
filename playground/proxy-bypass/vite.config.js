import { defineConfig } from 'vite'

const timeout = (ms) => new Promise((r) => setTimeout(r, ms))

export default defineConfig({
  server: {
    port: 9606,
    proxy: {
      '/nonExistentApp': {
        target: 'http://localhost:9607',
        bypass: () => {
          return false
        },
      },
      '/asyncResponse': {
        bypass: async (_, res) => {
          await timeout(4)
          res.writeHead(200, {
            'Content-Type': 'text/plain',
          })
          res.end('Hello after 4 ms (async timeout)')
          return '/asyncResponse'
        },
      },
      '/asyncThrowingError': {
        bypass: async () => {
          await timeout(4)
          throw new Error('bypass error')
        },
      },
    },
  },
})
