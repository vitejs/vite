// no node: protocol intentionally
// eslint-disable-next-line import-x/no-nodejs-modules
const fs = require('fs')
// eslint-disable-next-line import-x/no-nodejs-modules
const path = require('path')

// NOTE: require destructure would error immediately because of how esbuild
// compiles it. There's no way around it as it's direct property access, which
// triggers the Proxy get trap.

// access from default import
try {
  path.join()
} catch (e) {
  console.log('dep-with-builtin-module-cjs', e)
}

// access from function
module.exports.read = () => {
  return fs.readFileSync('test')
}
