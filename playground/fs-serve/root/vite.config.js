import path from 'node:path'
import { defineConfig } from 'vite'
import svgVirtualModulePlugin from './svgVirtualModulePlugin'
import matrixTestResultPlugin from './matrixTestResultPlugin'
import { getWindows83ShortNameForDotEnv } from './windows83Filename'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.html'),
      },
    },
    outDir: 'dist/main',
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
    DOTENV83SHORTNAME: JSON.stringify(getWindows83ShortNameForDotEnv()),
  },
  plugins: [svgVirtualModulePlugin(), matrixTestResultPlugin()],
})
