import { cac } from 'cac'
import chalk from 'chalk'
import { ServerOptions, startServer } from './commands/serve'

// check debug mode first before running any commands.
const {
  options: { debug }
} = cac().parse()
if (debug) {
  process.env.DEBUG = `vite:` + (debug === true ? '*' : debug)
  try {
    // only available as dev dependency
    require('source-map-support').install()
  } catch (e) {}
}

const cli = cac('vite')

// global options
interface GlobalCLIOptions {
  debug?: boolean | string
  config?: string
  root?: string
}

cli
  .option('--debug [feat]', `[string | boolean]  show debug logs`)
  .option('--config <file>', `[string]  use specified config file`)
  .option('--root <path>', `[string]  use specified config file`)

// serve
cli
  .command('[root]') // default command
  .alias('serve')
  .option('--host <host>', `[string] specify hostname`)
  .option('--port <port>', `[number] specify port`)
  .option('--https', `[boolean]  use TLS + HTTP/2`)
  .option('--cors', `[boolean]  enable CORS`)
  .option('--mode <mode>', `[string]  set env mode`, {
    default: 'development'
  })
  .action((root: string, options: ServerOptions & GlobalCLIOptions) => {
    if (root) options.root = root
    startServer(options, options.config)
  })

cli.help()
cli.version(require('../../package.json').version)

try {
  cli.parse()
} catch (e) {
  console.error(chalk.red(e.message))
  process.exit(1)
}
