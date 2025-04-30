const external = require('@vitejs/test-dep-esm-external')
// eslint-disable-next-line no-prototype-builtins
const result = external.hasOwnProperty('foo') ? 'ok' : 'error'
module.exports = { result }
