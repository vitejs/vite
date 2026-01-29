import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: path.join(import.meta.dirname, './root'),
})
