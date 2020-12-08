#!/usr/bin/env node
global.__vite_start_time = Date.now()

// check debug mode first before requiring any commands.
const debugIndex = process.argv.indexOf('--debug')

if (debugIndex > 0) {
  const value = process.argv[debugIndex + 1]
  process.env.DEBUG = `vite:` + (!value || value.startsWith('-') ? '*' : value)
  try {
    // only available as dev dependency
    require('source-map-support').install()
  } catch (e) {}
}

require('../dist/node/cli')
