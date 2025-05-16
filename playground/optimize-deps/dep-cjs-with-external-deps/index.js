const external = require('@vitejs/test-dep-esm-external')
const externalWithDefaultExport = require('@vitejs/test-dep-esm-external-with-default-export')
// eslint-disable-next-line no-prototype-builtins
const externalResult = external.hasOwnProperty('foo') ? 'ok' : 'error'
const externalWithDefaultExportResult = `${externalWithDefaultExport.foo()} ${externalWithDefaultExport()}`
module.exports = { externalResult, externalWithDefaultExportResult }
