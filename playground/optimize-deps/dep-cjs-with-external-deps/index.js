const external = require('@vitejs/test-dep-esm-external')
const externalDummyNodeBuiltin = require('node:dummy-builtin')
// eslint-disable-next-line no-prototype-builtins
const externalResult = external.hasOwnProperty('foo') ? 'ok' : 'error'
const externalDummyNodeBuiltinResult = `${externalDummyNodeBuiltin()} ${externalDummyNodeBuiltin.bar}`
module.exports = { externalResult, externalDummyNodeBuiltinResult }
