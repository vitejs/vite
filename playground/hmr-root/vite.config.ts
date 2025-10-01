import path from 'node:path'
import url from 'node:url'
import { defineConfig } from 'vite'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export default defineConfig({
  root: path.join(__dirname, './root'),
})
