'use strict'

// eslint-disable-next-line n/prefer-node-protocol
const events = require('events')
// eslint-disable-next-line n/prefer-node-protocol
const fs = require('fs')

module.exports =
  'foo' in events && fs.__explicitBrowserFieldTest === undefined ? 'pong' : ''
