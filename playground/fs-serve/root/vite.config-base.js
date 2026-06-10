import path from 'node:path'
import { defineConfig } from 'vite'
import svgVirtualModulePlugin from './svgVirtualModulePlugin'
import matrixTestResultPlugin from './matrixTestResultPlugin'
import { getWindows83ShortNameForDotEnv } from './windows83Filename'

const BASE = '/base/'

export default defineConfig({
  base: BASE,
  build: {
    rolldownOptions: {
      input: {
        main: path.resolve(import.meta.dirname, 'src/index.html'),
      },
    },
    outDir: 'dist/base',
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
    BASE: JSON.stringify(BASE),
    DOTENV83SHORTNAME: JSON.stringify(getWindows83ShortNameForDotEnv()),
  },
  plugins: [svgVirtualModulePlugin(), matrixTestResultPlugin()],
})
