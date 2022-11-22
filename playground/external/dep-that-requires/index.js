const { version } = require('vue')
// require('slash5') // cannot require ESM

document.querySelector('#required-vue-version').textContent = version
