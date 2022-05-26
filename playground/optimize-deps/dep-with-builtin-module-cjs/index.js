const { readFileSync } = require('fs')
const path = require('path')

// access from named import
try {
  readFileSync()
} catch (e) {
  console.log('dep-with-builtin-module-cjs', e)
}

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
