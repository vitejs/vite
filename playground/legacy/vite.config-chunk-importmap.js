import fs from 'node:fs'
import path from 'node:path'
import legacy from '@vitejs/plugin-legacy'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [legacy()],
  build: { chunkImportMap: true },
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
