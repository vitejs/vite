'use strict'

// This is the Node.js adapter - should not be used in browser
module.exports = function httpAdapter(config) {
  throw new Error('Node.js adapter should not be used in browser')
}
