const path = require('path')
const resolve = require('resolve-cwd')
const { sendJSStream } = require('./utils')

exports.moduleMiddleware = (id, res) => {
  let modulePath
  // TODO support custom imports map e.g. for snowpack web_modules

  // fallback to node resolve
  try {
    modulePath = resolve(id)
    if (id === 'vue') {
      modulePath = path.join(
        path.dirname(modulePath),
        'dist/vue.runtime.esm-browser.js'
      )
    }
  } catch (e) {
    res.setStatus(404)
    res.end()
  }

  sendJSStream(res, modulePath)
}
