import { defineConfig } from 'vite'

export default defineConfig({
  base: '/es/',
  resolve: {
    alias: {
      '@': __dirname,
    },
  },
  worker: {
    format: 'iife',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/worker_asset-[name].[ext]',
        chunkFileNames: 'assets/worker_chunk-[name].js',
        entryFileNames: 'assets/worker_entry-[name].js',
      },
    },
  },
  build: {
    sourcemap: false,
    outDir: 'dist/custom',
    assetsInlineLimit: 100, // keep SVG as assets URL
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js',
      },
    },
  },
  plugins: [],
})
