#!/usr/bin/env node
global.__vite_start_time = Date.now()

// check debug mode first before requiring any commands.
const debugIndex = process.argv.indexOf('--debug')

if (debugIndex > 0) {
  let value = process.argv[debugIndex + 1]
  if (!value || value.startsWith('-')) {
    value = 'vite:*'
  } else {
    // support debugging multiple flags with comma-separated list
    value = value
      .split(',')
      .map((v) => `vite:${v}`)
      .join(',')
  }
  process.env.DEBUG = value
  try {
    // only available as dev dependency
    require('source-map-support').install()
  } catch (e) {}
}

require('../dist/node/cli')
