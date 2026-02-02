import path from 'node:path'
import { defineConfig } from 'vite'
import svgVirtualModulePlugin from './svgVirtualModulePlugin'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, 'src/index.html'),
      },
    },
  },
  server: {
    fs: {
      strict: true,
      allow: [path.resolve(import.meta.dirname, 'src')],
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
    ROOT: JSON.stringify(path.dirname(import.meta.dirname).replace(/\\/g, '/')),
  },
  plugins: [svgVirtualModulePlugin()],
})
