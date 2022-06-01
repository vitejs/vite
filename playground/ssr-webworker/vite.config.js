import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    minify: false
  },
  resolve: {
    dedupe: ['react']
  },
  ssr: {
    target: 'webworker',
    noExternal: ['this-should-be-replaced-by-the-boolean']
  },
  plugins: [
    {
      config() {
        return {
          ssr: {
            noExternal: true
          }
        }
      }
    },
    {
      config() {
        return {
          ssr: {
            noExternal: ['this-should-not-replace-the-boolean']
          }
        }
      }
    }
  ]
})
