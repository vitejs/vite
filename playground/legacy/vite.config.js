import fs from 'node:fs'
import path from 'node:path'
import legacy from '@vitejs/plugin-legacy'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [
    legacy({
      targets: 'IE 11',
      modernPolyfills: true,
    }),
  ],

  build: {
    cssCodeSplit: false,
    manifest: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),
        nested: path.resolve(__dirname, 'nested/index.html'),
      },
      output: {
        chunkFileNames(chunkInfo) {
          if (chunkInfo.name === 'immutable-chunk') {
            return `assets/${chunkInfo.name}.js`
          }
          return `assets/chunk-[name].[hash].js`
        },
      },
    },
  },

  // for tests, remove `<script type="module">` tags and remove `nomodule`
  // attrs so that we run the legacy bundle instead.
  __test__() {
    const indexPath = path.resolve(__dirname, './dist/index.html')
    let index = fs.readFileSync(indexPath, 'utf-8')
    index = index
      .replace(/<script type="module".*?<\/script>/g, '')
      .replace(/<script nomodule/g, '<script')
    fs.writeFileSync(indexPath, index)
  },
})
