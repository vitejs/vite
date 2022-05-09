const path = require('path')

module.exports.hello = () => require(path.resolve(__dirname, './foo.js')).hello
