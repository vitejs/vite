/* eslint-disable no-restricted-globals */

// proxy cjs utils
Object.assign(module.exports, require('./dist/node-cjs/utils.cjs'))

// type utils
module.exports.defineConfig = (config) => config

// async functions, can be redirect from ESM build
module.exports.build = (...args) =>
  import('./dist/node/index.js').then((i) => i.build(...args))

module.exports.createServer = (...args) =>
  import('./dist/node/index.js').then((i) => i.createServer(...args))

module.exports.preview = (...args) =>
  import('./dist/node/index.js').then((i) => i.preview(...args))

module.exports.transformWithEsbuild = (...args) =>
  import('./dist/node/index.js').then((i) => i.transformWithEsbuild(...args))

module.exports.resolveConfig = (...args) =>
  import('./dist/node/index.js').then((i) => i.resolveConfig(...args))

module.exports.optimizeDeps = (...args) =>
  import('./dist/node/index.js').then((i) => i.optimizeDeps(...args))

module.exports.formatPostcssSourceMap = (...args) =>
  import('./dist/node/index.js').then((i) => i.formatPostcssSourceMap(...args))

// some sync functions are marked not supported due to their complexity and uncommon usage
const unsupportedCJS = ['resolvePackageEntry', 'resolvePackageData']
unsupportedCJS.forEach((name) => {
  module.exports[name] = (...args) => {
    throw new Error(`"${name}" is not supported in CJS build of Vite 3.
Please use ESM or dynamic imports \`const { ${name} } = await import('vite')\`.
`)
  }
})
