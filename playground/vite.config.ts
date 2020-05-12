import type { UserConfig } from 'vite'
import { sassPlugin } from './plugins/sassPlugin'
import { jsPlugin } from './plugins/jsPlugin'

const config: UserConfig = {
  alias: {
    alias: '/aliased'
  },
  jsx: 'preact',
  minify: false,
  serviceWorker: !!process.env.USE_SW,
  plugins: [sassPlugin, jsPlugin]
}

export default config
