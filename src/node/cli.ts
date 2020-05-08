import chalk from 'chalk'
import { Ora } from 'ora'
import { RollupError } from 'rollup'
import { networkInterfaces } from 'os'

console.log(chalk.cyan(`vite v${require('../package.json').version}`))
const s = Date.now()
const argv = require('minimist')(process.argv.slice(2))

if (argv.help) {
  // TODO print supported args on --help
}

// convert debug flag
if (argv.debug) {
  process.env.DEBUG = argv.debug === true ? 'vite:*' : argv.debug
}

Object.keys(argv).forEach((key) => {
  // cast xxx=false into actual `false`
  if (argv[key] === 'false') {
    argv[key] = false
  }
  // map jsx args
  if (key === 'jsx-factory') {
    ;(argv.jsx || (argv.jsx = {})).factory = argv[key]
  }
  if (key === 'jsx-fragment') {
    ;(argv.jsx || (argv.jsx = {})).fragment = argv[key]
  }
})

if (argv._[0] === 'build') {
  let spinner: Ora
  const msg = 'Building for production...'
  if (process.env.DEBUG || process.env.NODE_ENV === 'test') {
    console.log(msg)
  } else {
    spinner = require('ora')(msg + '\n').start()
  }
  require('../dist')
    .build({
      ...argv,
      cdn: argv.cdn === 'false' ? false : argv.cdn
    })
    .then(() => {
      spinner && spinner.stop()
      process.exit(0)
    })
    .catch((err: RollupError) => {
      spinner && spinner.stop()
      console.error(chalk.red(`[vite] Build errored out.`))
      console.error(err)
      process.exit(1)
    })
} else {
  const server = require('../dist').createServer(argv)

  let port = argv.port || 3000

  server.on('error', (e: Error & { code?: string }) => {
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
    const addresses = getIPv4AddressList()
    addresses.forEach((ip) => {
      console.log(`  > http://${ip}:${port}`)
    })
    console.log()
    require('debug')('vite:server')(`server ready in ${Date.now() - s}ms.`)

    if (argv.open) {
      require('./utils/openBrowser').openBrowser(
        `http://${addresses[0]}:${port}`
      )
    }
  })

  server.listen(port)
}

function getIPv4AddressList() {
  const interfaces = networkInterfaces()
  let result: string[] = []

  Object.keys(interfaces).forEach((key) => {
    const ips = (interfaces[key] || [])
      .filter((details) => details.family === 'IPv4')
      .map((detail) => detail.address.replace('127.0.0.1', 'localhost'))

    result = result.concat(ips)
  })

  return result
}
