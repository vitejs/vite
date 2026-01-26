'use strict'

var adapter = require('./adapters/http.js')

function Axios() {
  this.adapter = adapter
}

Axios.prototype.request = function request(config) {
  return this.adapter(config)
}

Axios.prototype.get = function get(url, config) {
  return this.request(
    Object.assign(config || {}, {
      method: 'get',
      url: url,
    }),
  )
}

var axios = new Axios()

module.exports = axios
module.exports.default = axios
