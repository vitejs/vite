import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    supported: {
      // Force esbuild inject helpers to test regex
      'object-rest-spread': false,
      'optional-chain': false,
    },
  },
  build: {
    // Force oxc inject helpers to test regex
    // - object rest spread
    // - optional chaining
    target: 'chrome46',
    rollupOptions: {
      output: {
        legalComments: 'inline',
        banner: `/*!\nMayLib\n*/`,
      },
    },
    lib: {
      entry: path.resolve(import.meta.dirname, 'src/main.js'),
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
            path.resolve(import.meta.dirname, 'index.dist.html'),
            'utf-8',
          ),
        })
      },
    },
  ],
})
