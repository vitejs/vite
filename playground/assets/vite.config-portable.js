/**
 * @type {import('vite').UserConfig}
 */

const baseConfig = require('./vite.config.js')
module.exports = {
  ...baseConfig,
  base: './', // relative base to make dist portable
  build: {
    ...baseConfig.build,
    outDir: 'dist',
    watch: false
  }
}
