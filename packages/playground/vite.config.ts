import { defineConfig } from 'vite'
import vue from 'rollup-plugin-vue'
import reactRefresh from '@vitejs/plugin-react-refresh'

export default defineConfig({
  plugins: [
    // reactRefresh,
    vue({
      hmr: true,
      vite: true
    })
  ],
  alias: {
    react: '@pika/react/source.development.js',
    'react-dom': '@pika/react-dom/source.development.js'
  },
  define: {
    __DEV__: true,
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false
  },
  esbuild: {
    // jsxFactory: 'h',
    // jsxFragment: 'Fragment'
  },
  server: {
    // proxy: {
    //   '/api': {
    //     target: 'http://jsonplaceholder.typicode.com',
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, '')
    //   }
    // }
  }
  // optimizeDeps: {
  //   auto: false
  // }
})
