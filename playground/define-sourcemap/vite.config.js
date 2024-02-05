import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    minify: false,
    sourcemap: true,
  },
  define: {
    __defineObject: '{ "hello": "test" }',
  },
})
