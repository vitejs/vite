const config = require('./vite.config-es')
config.worker.inlineUrl = 'base64'
config.base = '/inline-url/'
config.build.outDir = 'dist/inline-url'
module.exports = config
