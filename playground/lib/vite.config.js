import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    supported: {
      // Force esbuild inject helpers to test regex
      'object-rest-spread': false,
    },
  },
  build: {
    rollupOptions: {
      output: {
        banner: `/*!\nMayLib\n*/`,
      },
    },
    lib: {
      entry: path.resolve(__dirname, 'src/main.js'),
      name: 'MyLib',
      formats: ['es', 'umd', 'iife'],
      fileName: 'my-lib-custom-filename',
    },
  },
  plugins: [
    {
      name: 'emit-index',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'index.html',
          source: fs.readFileSync(
            path.resolve(__dirname, 'index.dist.html'),
            'utf-8',
          ),
        })
      },
    },
  ],
})
