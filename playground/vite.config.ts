import type { UserConfig } from 'vite'
import { jsPlugin } from './plugins/jsPlugin'
import { i18nTransform } from './custom-blocks/i18nTransform'

const config: UserConfig = {
  alias: {
    alias: '/alias/aliased',
    '/@alias/': require('path').resolve(__dirname, 'alias/aliased-dir')
  },
  jsx: 'preact',
  minify: false,
  serviceWorker: !!process.env.USE_SW,
  plugins: [jsPlugin],
  vueCustomBlockTransforms: { i18n: i18nTransform },
  optimizeDeps: {
    exclude: ['bootstrap', 'rewrite-unoptimized-test-package'],
    link: ['optimize-linked']
  },
  cssPreprocessOptions: {
    less: {
      modifyVars: {
        'preprocess-custom-color': 'green'
      }
    }
  },
  transformAssetUrls: {
    img: ['src', 'data-src']
  }
}

export default config
