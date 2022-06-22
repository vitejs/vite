'use strict'

const events = require('events')

module.exports = 'foo' in events ? 'pong' : ''
