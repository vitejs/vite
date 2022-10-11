import { defineConfig } from 'vite'
import { URL } from 'url'

// make sure bundling works even if `url` refers to the locally installed
// `url` package instead of the built-in `url` nodejs module
globalThis.__test_url = URL

export default defineConfig({
  server: {
    host: 'localhost'
  },
  build: {
    //speed up build
    minify: false,
    target: 'esnext'
  }
})
