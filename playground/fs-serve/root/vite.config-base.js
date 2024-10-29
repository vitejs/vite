import path from 'node:path'
import { defineConfig } from 'vite'

const BASE = '/base/'

export default defineConfig({
  base: BASE,
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.html'),
      },
    },
  },
  server: {
    fs: {
      strict: true,
      allow: [path.resolve(__dirname, 'src')],
    },
    hmr: {
      overlay: false,
    },
    headers: {
      'x-served-by': 'vite',
    },
  },
  preview: {
    headers: {
      'x-served-by': 'vite',
    },
  },
  define: {
    ROOT: JSON.stringify(path.dirname(__dirname).replace(/\\/g, '/')),
    BASE: JSON.stringify(BASE),
  },
})
