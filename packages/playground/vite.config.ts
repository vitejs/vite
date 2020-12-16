import { defineConfig } from 'vite'
import vue from 'rollup-plugin-vue'
import reactRefresh from '@vitejs/plugin-react-refresh'

export default defineConfig({
  // @ts-ignore (when linked locally the types of different rollup installations
  // conflicts, but for end user this will work properly)
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
    // vue: '/Users/evan/Vue/vite/node_modules/vue/dist/vue.runtime.esm-bundler.js',
    // '@vue/runtime-dom': '/Users/evan/Vue/vite/node_modules/@vue/runtime-dom/dist/runtime-dom.esm-bundler.js',
    // '@vue/runtime-core': '/Users/evan/Vue/vite/node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js',
    // '@vue/reactivity': '/Users/evan/Vue/vite/node_modules/@vue/reactivity/dist/reactivity.esm-bundler.js',
    // '@vue/shared': '/Users/evan/Vue/vite/node_modules/@vue/shared/dist/shared.esm-bundler.js'
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
    proxy: {
      '/api': {
        target: 'http://jsonplaceholder.typicode.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  optimizeDeps: {
    auto: false
  }
})
