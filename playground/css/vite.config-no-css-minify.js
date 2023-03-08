const baseConfig = require('./vite.config.js')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  ...baseConfig,
  build: {
    ...baseConfig.build,
    outDir: 'dist/no-css-minify',
    minify: true,
    cssMinify: false,
  },
}
