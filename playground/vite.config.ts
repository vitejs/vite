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
  vueCustomBlockTransforms: { i18n: i18nTransform },
  optimizeDeps: {
    exclude: ['bootstrap'],
    link: ['optimize-linked']
  },
  cssPreprocessOptions: {
    modifyVars: {
      'preprocess-custom-color': 'green'
    }
  }
}

export default config
