import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: [{ find: 'vue', replacement: 'vue/dist/vue.esm-bundler.js' }],
    extensions: ['.js'],
  },
})
