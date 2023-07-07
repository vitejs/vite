import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist/resolve-deps',
    minify: 'terser',
    terserOptions: {
      format: {
        beautify: true,
      },
      compress: {
        passes: 3,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('chunk.js')) {
            return 'chunk'
          }
        },
      },
    },
    modulePreload: {
      resolveDependencies(filename, deps, { hostId, hostType }) {
        if (filename.includes('hello')) {
          return [...deps, 'preloaded.js']
        }
        return deps
      },
    },
  },
  experimental: {
    renderBuiltUrl(filename, { hostId, hostType }) {
      if (filename.includes('preloaded')) {
        return { runtime: `""+${JSON.stringify('/' + filename)}` }
      }
      return { relative: true }
    },
  },
  cacheDir: 'node_modules/.vite-resolve-deps',
})
