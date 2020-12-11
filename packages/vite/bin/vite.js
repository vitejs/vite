#!/usr/bin/env node
global.__vite_start_time = Date.now()

// check debug mode first before requiring the CLI.
const debugIndex = process.argv.indexOf('--debug')
const filterIndex = process.argv.indexOf('--filter')

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

  if (filterIndex > 0) {
    const filter = process.argv[filterIndex + 1]
    if (filter && !filter.startsWith('-')) {
      process.env.VITE_DEBUG_FILTER = filter
    }
  }

  try {
    // only available as dev dependency
    require('source-map-support').install()
  } catch (e) {}
}

require('../dist/node/cli')
