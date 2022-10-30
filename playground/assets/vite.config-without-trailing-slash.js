const baseConfig = require('./vite.config.js')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  ...baseConfig,
  base: '/foo', // overwrite the original base: '/foo/'
  build: {
    ...baseConfig.build,
    outDir: 'dist/without-trailing-slash'
  }
}
