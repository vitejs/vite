// `stream` is used as the package name for `@vitejs/test-dep-esm-dummy-node-builtin` so that it is treated like a Node builtin
// eslint-disable-next-line n/prefer-node-protocol
let externalDummyNodeBuiltin = require('stream')
// NOTE: plugin-commonjs adds some compat code (`requireReturnsDefault`), but rolldown doesn't
if (process.env.NODE_ENV === 'production') {
  const mod = externalDummyNodeBuiltin
  externalDummyNodeBuiltin = mod.default
  for (const key in mod) {
    externalDummyNodeBuiltin[key] = mod[key]
  }
}
const external = require('@vitejs/test-dep-esm-external')
// eslint-disable-next-line no-prototype-builtins
const externalResult = external.hasOwnProperty('foo') ? 'ok' : 'error'
const externalDummyNodeBuiltinResult = `${externalDummyNodeBuiltin()} ${externalDummyNodeBuiltin.bar}`
module.exports = { externalResult, externalDummyNodeBuiltinResult }
