import path from 'node:path'
import fs from 'node:fs'
import { defineConfig } from 'vite'
import vuePlugin from '@vitejs/plugin-vue'
import legacyPlugin from '@vitejs/plugin-legacy'

export default defineConfig({
  base: '',
  resolve: {
    alias: {
      '@': __dirname
    }
  },
  plugins: [
    legacyPlugin({
      targets: ['defaults', 'not IE 11', 'chrome > 48']
    }),
    vuePlugin()
  ],
  build: {
    minify: false
  },
  // special test only hook
  // for tests, remove `<script type="module">` tags and remove `nomodule`
  // attrs so that we run the legacy bundle instead.
  // @ts-ignore
  __test__() {
    const indexPath = path.resolve(__dirname, './dist/index.html')
    let index = fs.readFileSync(indexPath, 'utf-8')
    index = index
      .replace(/<script type="module".*?<\/script>/g, '')
      .replace(/<script nomodule/g, '<script')
    fs.writeFileSync(indexPath, index)
  }
})
