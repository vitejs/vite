import type { UserConfig } from 'vite'
import { jsPlugin } from './plugins/jsPlugin'

const config: UserConfig = {
  alias: {
    alias: '/aliased',
    '/@alias/': require('path').resolve(__dirname, 'aliased-dir')
  },
  jsx: 'preact',
  minify: false,
  serviceWorker: !!process.env.USE_SW,
  plugins: [jsPlugin],
  optimizeDeps: {
    exclude: ['bootstrap'],
    link: ['optimize-linked']
  }
}

export default config
