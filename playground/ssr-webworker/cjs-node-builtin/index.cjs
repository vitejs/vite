const util = require('node:util')

module.exports.format = () =>
  util.format('[success] %s', 'cjs node builtin require')
