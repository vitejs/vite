import type { UserConfig } from 'vite'
import { jsPlugin } from './plugins/jsPlugin'
import { i18nPlugin } from './custom-blocks/i18nPlugin'

const config: UserConfig = {
  alias: {
    alias: '/aliased',
    '/@alias/': require('path').resolve(__dirname, 'aliased-dir')
  },
  jsx: 'preact',
  minify: false,
  serviceWorker: !!process.env.USE_SW,
  plugins: [jsPlugin, i18nPlugin],
  optimizeDeps: {
    commonJSWhitelist: ['moment']
  }
}

export default config
