const baseConfig = require('./vite.config')

module.exports = {
  ...baseConfig,
  build: {
    ...baseConfig.build,
    minify: false,
    outDir: 'dist/nominify',
  },
  plugins: [],
}
