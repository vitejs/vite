// @ts-check
import vuePlugin from '@vitejs/plugin-vue'
import reactRefresh from '@vitejs/plugin-react-refresh'

/**
 * @type {import('vite').UserConfig}
 */
export default {
  plugins: [vuePlugin(), reactRefresh()],
  build: {
    minify: false
  }
}
