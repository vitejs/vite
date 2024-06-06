'use strict'

// eslint-disable-next-line i/no-nodejs-modules
const events = require('events')

module.exports = 'foo' in events ? 'pong' : ''
