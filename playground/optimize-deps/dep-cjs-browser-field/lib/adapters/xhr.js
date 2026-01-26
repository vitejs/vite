'use strict'

module.exports = function xhrAdapter(config) {
  return Promise.resolve({ data: 'pong' })
}
