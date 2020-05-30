import type { UserConfig } from 'vite'
import { jsPlugin } from './plugins/jsPlugin'
import { i18nServerPlugin } from './custom-blocks/i18nServerPlugin'

const config: UserConfig = {
  alias: {
    alias: '/aliased',
    '/@alias/': require('path').resolve(__dirname, 'aliased-dir')
  },
  jsx: 'preact',
  minify: false,
  serviceWorker: !!process.env.USE_SW,
  plugins: [jsPlugin],
  configureServer: [i18nServerPlugin],
  optimizeDeps: {
    commonJSWhitelist: ['moment']
  }
}

export default config
