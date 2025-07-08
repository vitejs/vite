'use strict'

// eslint-disable-next-line n/prefer-node-protocol
const events = require('events')

module.exports = 'foo' in events ? 'pong' : ''
