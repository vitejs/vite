const path = require('path')
const cpp = require(path.resolve(__dirname, './build/Release/cpp_addon.node'))
exports.hello = cpp.hello
