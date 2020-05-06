#!/usr/bin/env node
const s = Date.now()
const chalk = require('chalk')
const argv = require('minimist')(process.argv.slice(2))

console.log(chalk.cyan(`vite v${require('../package.json').version}`))

Object.keys(argv).forEach((key) => {
  if (argv[key] === 'false') {
    argv[key] = false
  }
  if (key === 'jsx-factory') {
    ;(argv.jsx || (argv.jsx = {})).factory = argv[key]
  }
  if (key === 'jsx-fragment') {
    ;(argv.jsx || (argv.jsx = {})).fragment = argv[key]
  }
})

if (argv._[0] === 'build') {
  console.log('Building for production...')
  require('../dist')
    .build({
      ...argv,
      cdn: argv.cdn === 'false' ? false : argv.cdn
    })
    .catch((err) => {
      console.error(chalk.red(`[vite] Build errored out.`))
      // TODO pretty print this
      // rollup errors contain helpful information
      console.error(err)
      process.exit(1)
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
    console.log()
    require('debug')('vite:server')(`server ready in ${Date.now() - s}ms.`)
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
