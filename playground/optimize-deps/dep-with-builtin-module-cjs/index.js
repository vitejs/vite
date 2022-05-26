const path = require('path')

// NOTE: require destructure would error immediately to to how esbuild compiles
// it. There's no way around as it's direct property access, which triggers
// the Proxy get trap.

// access from default import
try {
  path.join()
} catch (e) {
  console.log('dep-with-builtin-module-cjs', e)
}

// access from function
module.exports.read = () => {
  return readFileSync('test')
}
