'use strict'

var adapter = require('./adapters/http.js')

module.exports = {
  get: function (url) {
    return adapter({ method: 'GET', url: url })
  },
}
