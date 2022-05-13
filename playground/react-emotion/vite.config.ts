import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin']
      }
    })
  ],
  clearScreen: false,
  build: {
    // to make tests faster
    minify: false
  }
})
