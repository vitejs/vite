import type { UserConfig } from 'vite'
import { jsPlugin } from './plugins/jsPlugin'

const config: UserConfig = {
  alias: {
    alias: '/aliased'
  },
  jsx: 'preact',
  minify: false,
  serviceWorker: !!process.env.USE_SW,
  plugins: [jsPlugin],
  optimizeDeps: {
    commonJSWhitelist: ['moment']
  }
}

export default config
