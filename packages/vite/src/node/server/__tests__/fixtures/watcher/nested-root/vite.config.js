import { defineConfig } from 'vite'
import '../config-deps/foo.js'

export default defineConfig({
  envDir: '../custom-env',
  publicDir: '../custom-public',
})
