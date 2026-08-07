// A bundled CommonJS module that internally `require()`s a Node builtin, the way
// dependencies like node-forge do. Under `ssr.target: 'webworker'` this require
// must be converted to an ESM import; otherwise it falls through to Rolldown's
// throwing `__require` stub. Regression test for the empty-`external` gap.
const util = require('node:util')
module.exports.format = () =>
  util.format('[success] %s', 'cjs node builtin require')
