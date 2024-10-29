import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    minify: false,
  },
  resolve: {
    dedupe: ['react'],
    conditions: ['worker'],
  },
  ssr: {
    target: 'webworker',
    noExternal: ['this-should-be-replaced-by-the-boolean'],
    // Some webworker builds may choose to externalize node builtins as they may be implemented
    // in the runtime, and so we can externalize it when bundling.
    external: ['node:assert'],
  },
  plugins: [
    {
      name: '@vitejs/test-ssr-webworker/no-external',
      config() {
        return {
          ssr: {
            noExternal: true,
          },
        }
      },
    },
    {
      name: '@vitejs/test-ssr-webworker/no-external-array',
      config() {
        return {
          ssr: {
            noExternal: ['this-should-not-replace-the-boolean'],
          },
        }
      },
    },
  ],
})
