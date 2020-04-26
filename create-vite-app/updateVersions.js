const fs = require('fs')
const path = require('path')

const pkg = require('./template/_package.json')

pkg.dependencies.vue = `^` + require('vue/package.json').version
pkg.devDependencies.vite = `^` + require('../package.json').version
pkg.devDependencies['@vue/compiler-sfc'] = pkg.dependencies.vue

fs.writeFileSync(
  path.join(__dirname, 'template/_package.json'),
  JSON.stringify(pkg, null, 2)
)
