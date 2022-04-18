const dep = require('./dep.cjs')

const msg =
  dep === '1.111222233334444555566e+21'
    ? '[success] require-pkg-with-module-field'
    : '[failed] require-pkg-with-module-field'

exports.msg = msg
