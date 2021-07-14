#!/usr/bin/env node
/* eslint-disable node/shebang */

const { yellow, green } = require('kolorist')
console.warn(
  yellow(
    `\n@vitejs/create-app is deprecated, use ${green(
      'npm init vite'
    )} instead\n`
  )
)

require('create-vite')
