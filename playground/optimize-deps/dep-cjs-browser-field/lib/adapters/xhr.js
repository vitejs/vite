'use strict'

module.exports = function xhrAdapter(config) {
  return new Promise(function (resolve) {
    var request = new XMLHttpRequest()
    request.open(config.method, config.url, true)
    request.onload = function () {
      resolve({ data: request.responseText })
    }
    request.send()
  })
}
