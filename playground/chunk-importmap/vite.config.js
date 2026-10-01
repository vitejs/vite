import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    chunkImportMap: true,
    sourcemap: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'static',
              test: /\/static\.js$/,
            },
          ],
        },
      },
    },
  },
})
