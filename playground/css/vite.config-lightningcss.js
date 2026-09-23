import { composeVisitors } from 'lightningcss'
import { defineConfig } from 'vite'
import {
  nestedLikePlugin,
  testDirDep,
  testInjectUrl,
  testSourceInput,
} from './lightningcss-plugins.js'
import baseConfig from './vite.config.js'

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
        testDirDep,
        testSourceInput(),
        testInjectUrl(),
      ]),
    },
  },
  cacheDir: 'node_modules/.vite-no-css-minify',
})
