const external = require('@vitejs/test-dep-esm-external')
const externalWithFunctionDefaultExport = require('@vitejs/test-dep-esm-external-with-function-default-export')
// eslint-disable-next-line no-prototype-builtins
const externalResult = external.hasOwnProperty('foo') ? 'ok' : 'error'
const externalWithFunctionDefaultExportResult =
  externalWithFunctionDefaultExport() === 'foo' ? 'ok' : 'error'
module.exports = { externalResult, externalWithFunctionDefaultExportResult }
