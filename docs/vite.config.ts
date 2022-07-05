import { defineConfig } from 'vite'

export default defineConfig({
  ssr: {
    format: 'cjs'
  },
  legacy: {
    buildSsrCjsExternalHeuristics: true
  },
  optimizeDeps: {
    // vitepress is aliased with replacement `join(DIST_CLIENT_PATH, '/index')`
    // This needs to be excluded from optimization
    exclude: ['vitepress']
  }
})
