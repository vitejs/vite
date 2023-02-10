const config = require('./vite.config-es')
config.worker.inlineUrl = 'data'
config.base = '/inline-url/'
config.build.outDir = 'dist/inline-url'
module.exports = config
