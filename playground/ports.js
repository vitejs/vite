// TODO: migrate to ESM
const path = require('path')

// make sure these ports are unique
module.exports.ports = {
  cli: 9510,
  'cli-module': 9511,
  'legacy/ssr': 9520,
  lib: 9521,
  'optimize-missing-deps': 9522,
  'ssr-deps': 9600,
  'ssr-html': 9601,
  'ssr-pug': 9602,
  'ssr-react': 9603,
  'ssr-vue': 9604,
  'ssr-webworker': 9605,
  'css/postcss-caching': 5005,
  'css/postcss-plugins-different-dir': 5006
}

module.exports.workspaceRoot = path.resolve(__dirname, '../')
