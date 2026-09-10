import { defineConfig } from 'vite'

const firstTarget =
  process.env.VITE_TEST_PROXY_FIRST_TARGET ?? 'http://localhost:9627'
const secondTarget =
  process.env.VITE_TEST_PROXY_SECOND_TARGET ?? 'http://localhost:9628'

export default defineConfig({
  server: {
    proxy: {
      '/dynamic': {
        target: (req) =>
          req.url?.startsWith('/dynamic/first') ? firstTarget : secondTarget,
        rewrite: (path) => path.replace(/^\/dynamic\/(?:first|second)/, ''),
      },
    },
  },
})
