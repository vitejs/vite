import { defineConfig } from 'vite'

export default defineConfig({
  ssr: {
    target: 'node-cjs'
  }
})
