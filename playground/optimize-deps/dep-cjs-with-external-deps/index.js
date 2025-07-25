// `stream` is used as the package name for `@vitejs/test-dep-esm-dummy-node-builtin` so that it is treated like a Node builtin
// eslint-disable-next-line n/prefer-node-protocol
const externalDummyNodeBuiltin = require('stream')
const external = require('@vitejs/test-dep-esm-external')
// eslint-disable-next-line no-prototype-builtins
const externalResult = external.hasOwnProperty('foo') ? 'ok' : 'error'
const externalDummyNodeBuiltinResult = `${externalDummyNodeBuiltin()} ${externalDummyNodeBuiltin.bar}`
module.exports = { externalResult, externalDummyNodeBuiltinResult }
