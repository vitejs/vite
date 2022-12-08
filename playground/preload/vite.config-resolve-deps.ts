import vuePlugin from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vuePlugin()],
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
    modulePreload: {
      resolveDependencies(filename, deps, { hostId, hostType }) {
        if (filename.includes('Hello')) {
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
})
