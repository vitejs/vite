import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import viteLegacyPlugin from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [viteLegacyPlugin()],
  build: {
    manifest: true,
    rollupOptions: {
      input: {
        styles: resolve(__dirname, './src/styles.css'),
      },
    },
    watch: {},
    emptyOutDir: true,
  },
})
