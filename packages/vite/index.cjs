// Proxy ESM to be used in CJS

module.exports.build = (...args) =>
  import('./dist/node/index.js').then((i) => i.build(...args))

module.exports.createServer = (...args) =>
  import('./dist/node/index.js').then((i) => i.createServer(...args))

module.exports.preview = (...args) =>
  import('./dist/node/index.js').then((i) => i.preview(...args))

module.exports.transformWithEsbuild = (...args) =>
  import('./dist/node/index.js').then((i) => i.transformWithEsbuild(...args))
