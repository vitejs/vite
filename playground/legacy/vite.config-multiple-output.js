import legacy from '@vitejs/plugin-legacy'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [legacy({ modernPolyfills: true })],
  build: {
    manifest: true,
    minify: false,
    rollupOptions: {
      output: [
        {
          assetFileNames() {
            return 'assets/subdir/[name]-[hash][extname]'
          },
          entryFileNames: `assets/subdir/[name].js`,
          chunkFileNames: `assets/subdir/[name].js`,
        },
        {
          assetFileNames() {
            return 'assets/subdir/[name]-[hash][extname]'
          },
          entryFileNames: `assets/anotherSubdir/[name].js`,
          chunkFileNames: `assets/anotherSubdir/[name].js`,
        },
      ],
    },
  },
})
