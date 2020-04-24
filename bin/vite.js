#!/usr/bin/env node
const chalk = require('chalk')
const argv = require('minimist')(process.argv.slice(2))

if (argv._[0] === 'build') {
  require('../dist')
    .build(argv)
    .catch((err) => {
      console.error(chalk.red(`[vite] Build errored out.`))
      console.log(err)
    })
} else {
  const server = require('../dist').createServer(argv)

  let port = argv.port || 3000

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`port ${port} is in use, trying another one...`)
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
    console.log(`Running at http://localhost:${port}`)
  })

  server.listen(port)
}
