// An explicit browser:false mapping is an empty module, not a Node builtin warning.
// eslint-disable-next-line n/no-missing-require -- mapped to false by package browser field
const fs = require('browser-false-only')
module.exports = fs.readFileSync === undefined ? '[success]' : '[fail]'
