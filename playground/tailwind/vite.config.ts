import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

function delayIndexCssPlugin(): Plugin {
  let server
  return {
    name: 'delay-index-css',
    enforce: 'pre',
    configureServer(_server) {
      server = _server
    },
    async load(id) {
      if (server && id.includes('index.css')) {
        await server.waitForRequestsIdle(id)
      }
    },
  }
}

export default defineConfig({
  resolve: {
    alias: {
      '/@': __dirname,
    },
  },
  build: {
    // to make tests faster
    minify: false,
  },
  server: {
    // This option caused issues with HMR,
    // although it should not affect the build
    origin: 'http://localhost:8080',
  },
  plugins: [
    {
      name: 'delay view',
      enforce: 'pre',
      async transform(_code, id) {
        if (id.includes('views/view1.js')) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      },
    },
    delayIndexCssPlugin(),
  ],
})
