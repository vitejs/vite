/* eslint-disable no-restricted-globals */
// Proxy ESM to be used in CJS

module.exports.build = (...args) =>
  import('./dist/node/index.js').then((i) => i.build(...args))

module.exports.createServer = (...args) =>
  import('./dist/node/index.js').then((i) => i.createServer(...args))

module.exports.preview = (...args) =>
  import('./dist/node/index.js').then((i) => i.preview(...args))

module.exports.transformWithEsbuild = (...args) =>
  import('./dist/node/index.js').then((i) => i.transformWithEsbuild(...args))

module.exports.formatPostcssSourceMap = (...args) =>
  import('./dist/node/index.js').then((i) => i.formatPostcssSourceMap(...args))

module.exports.splitVendorChunkPlugin = (...args) =>
  require('./dist/node-cjs/splitVendorChunk.cjs').splitVendorChunkPlugin(...args)

module.exports.defineConfig = (config) => config

const os = require('os')
const path = require('path')
const isWindows = os.platform() === 'win32'

function slash(p) {
  return p.replace(/\\/g, '/')
}

module.exports.normalizePath = (id) => {
  return path.posix.normalize(isWindows ? slash(id) : id)
}
