#!/usr/bin/env node
/* eslint-disable node/shebang */

const { yellow, green } = require('kolorist')

const alternativeCommands = {
  yarn: 'yarn create vite',
  pnpm: 'pnpx create-vite',
  npm: 'npm init vite',
  unknown: 'npm init vite'
}

function getPackageManager() {
  if (!process.env.npm_execpath) {
    return 'unknown'
  }

  if (process.env.npm_execpath.indexOf('yarn') !== -1) {
    return 'yarn'
  }
  if (process.env.npm_execpath.indexOf('pnpm') !== -1) {
    return 'pnpm'
  }
  if (process.env.npm_execpath.indexOf('npm') !== -1) {
    return 'npm'
  }

  return 'unknown'
}

const packageManager = getPackageManager()

const alternativeCommand = alternativeCommands[packageManager]

console.warn(
  yellow(
    `\n@vitejs/create-app is deprecated, use ${green(
      alternativeCommand
    )} instead\n`
  )
)

require('create-vite')
