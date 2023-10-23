import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '/@': __dirname,
    },
  },
  build: {
    // to make tests faster
    minify: false,
  },
  server: {
    // This option caused issues with HMR,
    // although it should not affect the build
    origin: 'http://localhost:8080',
  },
  plugins: [
    {
      name: 'delay view',
      enforce: 'pre',
      async transform(_code, id) {
        if (id.includes('views/view1.js')) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      },
    },
  ],
})
