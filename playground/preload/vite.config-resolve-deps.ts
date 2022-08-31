import path from 'node:path'
import vuePlugin from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vuePlugin()],
  build: {
    minify: 'terser',
    terserOptions: {
      format: {
        beautify: true
      },
      compress: {
        passes: 3
      }
    },
    modulePreload: {
      resolveDependencies(url, deps, { importer }) {
        return deps.map((dep) => {
          return dep.includes('.js')
            ? { relative: dep }
            : {
                runtime: `new URL(${JSON.stringify(
                  path.relative(path.dirname(importer), dep)
                )},import.meta.url).href`
              }
        })
      }
    }
  }
})
