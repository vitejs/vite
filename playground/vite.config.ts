import type { UserConfig } from 'vite'
import { sassPlugin } from './plugins/sassPlugin'
import { jsPlugin } from './plugins/jsPlugin'

const config: UserConfig = {
  alias: {
    alias: '/aliased'
  },
  jsx: 'preact',
  minify: false,
  plugins: [sassPlugin, jsPlugin]
}

export default config
