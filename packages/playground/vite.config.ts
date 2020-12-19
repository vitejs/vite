import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import reactRefresh from '@vitejs/plugin-react-refresh'

export default defineConfig({
  plugins: [reactRefresh(), vue()],
  alias: {
    react: '@pika/react/source.development.js',
    'react-dom': '@pika/react-dom/source.development.js'
  },
  define: {
    __DEV__: true
  }
})
