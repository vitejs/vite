#!/usr/bin/env node
const argv = require('minimist')(process.argv.slice(2))
const server = require('../dist/server').createServer(argv)

let port = argv.port || 3000

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log(`port ${port} is in use, trying another one...`)
    setTimeout(() => {
      server.close()
      server.listen(++port)
    }, 100)
  } else {
    console.error(e)
  }
})

server.on('listening', () => {
  console.log(`Running at http://localhost:${port}`)
})

server.listen(port)
