import { defineConfig } from 'vite'
import { composeVisitors } from 'lightningcss'
import baseConfig from './vite.config.js'
import {
  nestedLikePlugin,
  testDirDep,
  testInjectUrl,
  testSourceInput,
} from './lightningcss-plugins'

export default defineConfig({
  ...baseConfig,
  css: {
    ...baseConfig.css,
    transformer: 'lightningcss',
    lightningcss: {
      cssModules: {
        pattern: '[name]__[local]___[hash]',
      },
      visitor: composeVisitors([
        nestedLikePlugin(),
        testDirDep(),
        testSourceInput(),
        testInjectUrl(),
      ]),
    },
  },
  cacheDir: 'node_modules/.vite-no-css-minify',
})
