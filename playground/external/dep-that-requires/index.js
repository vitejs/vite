const { version } = require('vue')
const { default: slash } = require('slash')

document.querySelector('#required-vue-version').textContent = version
document.querySelector('#required-slash-exists').textContent = !!slash
