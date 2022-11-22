const { version } = require('vue')
// require('slash5') // cannot require ESM
const slash3 = require('slash3')

document.querySelector('#required-vue-version').textContent = version
document.querySelector('#required-slash3-exists').textContent =
  !!slash3('foo/bar')
