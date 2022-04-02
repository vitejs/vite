const fromEvent = require('callbag-from-event')

const msg =
  // should be the exported function instead of the ES Module record (`{ default: ... }`)
  typeof fromEvent === 'function'
    ? '[success] require-pkg-with-esm-entries'
    : '[failed] require-pkg-with-esm-entries'

exports.msg = msg
