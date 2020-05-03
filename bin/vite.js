#!/usr/bin/env node
const path = require('path')
const chalk = require('chalk')
const argv = require('minimist')(process.argv.slice(2))

console.log(chalk.cyan(`vite v${require('../package.json').version}`))

Object.keys(argv).forEach((key) => {
  if (argv[key] === 'false') {
    argv[key] = false
  }
})

if (argv._[0] === 'build') {
  console.log(chalk.yellow('Building for production...'))
  require('../dist')
    .build({
      ...argv,
      cdn: argv.cdn === 'false' ? false : argv.cdn
    })
    .catch((err) => {
      console.error(chalk.red(`[vite] Build errored out.`))
      console.log(err)
    })
} else {
  const server = require('../dist').createServer(argv)

  let port = argv.port || 3000

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying another one...`)
      setTimeout(() => {
        server.close()
        server.listen(++port)
      }, 100)
    } else {
      console.error(chalk.red(`[vite] server error:`))
      console.error(e)
    }
  })

  server.on('listening', () => {
    console.log(`Dev server running at:`)
    getIPv4AddressList().forEach((ip) => {
      console.log(`  > http://${ip}:${port}`)
    })
    console.log(' ')
  })

  server.listen(port)
}

function getIPv4AddressList() {
  const networkInterfaces = require('os').networkInterfaces()
  let result = []

  Object.keys(networkInterfaces).forEach((key) => {
    const ips = (networkInterfaces[key] || [])
      .filter((details) => details.family === 'IPv4')
      .map((detail) => detail.address.replace('127.0.0.1', 'localhost'))

    result = result.concat(ips)
  })

  return result
}
