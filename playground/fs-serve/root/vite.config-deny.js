import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
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
      deny: ['**/deny/**'],
    },
  },
  define: {
    ROOT: JSON.stringify(path.dirname(__dirname).replace(/\\/g, '/')),
  },
})
