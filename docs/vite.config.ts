import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    // vitepress is an aliased with replacement `join(DIST_CLIENT_PATH, '/index')`
    // This needs to be excluded from optimization
    exclude: ['vitepress']
  },
  ssr: {
    // And it is also marked as noExternal, so it is safer to exclude it in SSR too
    // Right now in Vite we are bailing out for aliased deps during SSR by default
    // but this may change in the future
    optimizeDeps: {
      exclude: ['vitepress']
    },
    format: 'cjs'
  },
  legacy: {
    buildSsrCjsExternalHeuristics: true
  }
})
