import type { UserConfig } from 'vite'
import { jsPlugin } from './plugins/jsPlugin'
import { i18nTransform } from './custom-blocks/i18nTransform'

const config: UserConfig = {
  alias: {
    alias: '/aliased',
    '/@alias/': require('path').resolve(__dirname, 'aliased-dir')
  },
  jsx: 'preact',
  minify: false,
  serviceWorker: !!process.env.USE_SW,
  plugins: [jsPlugin],
  transforms: [i18nTransform],
  optimizeDeps: {
    commonJSWhitelist: ['moment']
  }
}

export default config
