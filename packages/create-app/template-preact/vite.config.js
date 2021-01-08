// @ts-check
import preactRefresh from '@prefresh/vite'

/**
 * @type { import('vite').UserConfig }
 */
const config = {
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsxInject: `import { h, Fragment } from 'preact'`
  },
  plugins: [preactRefresh()]
}

export default config
