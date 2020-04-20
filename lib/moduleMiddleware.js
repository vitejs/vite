const fs = require('fs')
const path = require('path')
const { sendJS } = require('./utils')

exports.moduleMiddleware = (id, res) => {
  let modulePath
  // try node resolve first
  try {
    modulePath = require.resolve(id)
  } catch (e) {
    res.setStatus(404)
    res.end()
  }

  // TODO resolve snowpack web_modules

  if (id === 'vue') {
    // modulePath = path.relative(modulePath, 'dist/vue.runtime.esm-browser.js')
    modulePath = path.resolve(__dirname, 'vue.js')
  }

  sendJS(res, fs.readFileSync(modulePath))
}
