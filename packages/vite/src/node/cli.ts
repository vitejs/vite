import { cac } from 'cac'
import chalk from 'chalk'
import { startServer, ServerOptions } from './server'

const cli = cac('vite')

// global options
interface GlobalCLIOptions {
  '--'?: string[]
  debug?: boolean | string
  config?: string
  root?: string
  mode?: string
}

/**
 * removing global flags before passing as command specific sub-configs
 */
function cleanOptions(options: GlobalCLIOptions) {
  const ret = { ...options }
  delete ret['--']
  delete ret.debug
  delete ret.config
  delete ret.root
  delete ret.mode
  return ret
}

cli
  .option('--debug [feat]', `[string | boolean]  show debug logs`)
  .option('--config <file>', `[string]  use specified config file`)
  .option('--root <path>', `[string]  use specified config file`)

// dev
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
    // output structure is preserved even after bundling so require()
    // is ok here
    const start = require('./server/index').startServer as typeof startServer
    start(
      {
        root,
        server: cleanOptions(options) as ServerOptions
      },
      options.mode,
      options.config
    ).catch((e) => {
      console.error(chalk.red(e.toString()))
      process.exit(1)
    })
  })

cli.help()
cli.version(require('../../package.json').version)

try {
  cli.parse()
} catch (e) {
  console.error(chalk.red(e.message))
  process.exit(1)
}
