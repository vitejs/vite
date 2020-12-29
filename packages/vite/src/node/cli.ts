import { cac } from 'cac'
import chalk from 'chalk'
import { BuildOptions } from './build'
import { ServerOptions } from './server'
import { createLogger, LogLevel } from './logger'
import { resolveConfig } from '.'

const cli = cac('vite')

// global options
interface GlobalCLIOptions {
  '--'?: string[]
  debug?: boolean | string
  d?: boolean | string
  filter?: string
  f?: string
  config?: string
  c?: boolean | string
  root?: string
  r?: string
  mode?: string
  m?: string
  logLevel?: LogLevel
  l?: LogLevel
}

/**
 * removing global flags before passing as command specific sub-configs
 */
function cleanOptions(options: GlobalCLIOptions) {
  const ret = { ...options }
  delete ret['--']
  delete ret.debug
  delete ret.d
  delete ret.filter
  delete ret.f
  delete ret.config
  delete ret.c
  delete ret.root
  delete ret.r
  delete ret.mode
  delete ret.m
  delete ret.logLevel
  delete ret.l
  return ret
}

cli
  .option('-c, --config <file>', `[string] use specified config file`)
  .option('-r, --root <path>', `[string] use specified config file`)
  .option('-l, --logLevel <level>', `[string] silent | error | warn | all`)
  .option('-d, --debug [feat]', `[string | boolean] show debug logs`)
  .option('-f, --filter [filter]', `[string] filter debug logs`)

// dev
cli
  .command('[root]') // default command
  .alias('serve')
  .option('--host <host>', `[string] specify hostname`)
  .option('--port <port>', `[number] specify port`)
  .option('--https', `[boolean] use TLS + HTTP/2`)
  .option('--open', `[boolean | string] open browser on startup`)
  .option('--cors', `[boolean] enable CORS`)
  .option('-m, --mode <mode>', `[string] set env mode`, {
    default: 'development'
  })
  .option(
    '--force',
    `[boolean]  force the optimizer to ignore the cache and re-bundle`
  )
  .action(async (root: string, options: ServerOptions & GlobalCLIOptions) => {
    // output structure is preserved even after bundling so require()
    // is ok here
    const { createServer } = await import('./server')
    try {
      const server = await createServer(
        {
          root,
          mode: options.mode,
          logLevel: options.logLevel,
          server: cleanOptions(options) as ServerOptions
        },
        options.config
      )
      await server.listen()
    } catch (e) {
      const logError = createLogger(options.logLevel).error
      logError(chalk.red(`error when starting dev server:\n${e.stack}`))
      process.exit(1)
    }
  })

// build
cli
  .command('build [root]')
  .option(
    '--entry <file>',
    `[string]  entry file for build (default: index.html)`
  )
  .option('--base <path>', `[string]  public base path (default: /)`)
  .option('--outDir <dir>', `[string]  output directory (default: dist)`)
  .option(
    '--assetsDir <dir>',
    `[string]  directory under outDir to place assets in (default: _assets)`
  )
  .option(
    '--assetsInlineLimit <number>',
    `[number]  static asset base64 inline threshold in bytes (default: 4096)`
  )
  .option('--ssr', `[boolean]  build for server-side rendering`)
  .option(
    '--sourcemap',
    `[boolean]  output source maps for build (default: false)`
  )
  .option(
    '--minify [minifier]',
    `[boolean | "terser" | "esbuild"] enable/disable minification, ` +
      `or specify minifier to use (default: terser)`
  )
  .option('--manifest', `[boolean] emit build manifest json`)
  .option('-m, --mode <mode>', `[string]  set env mode`, {
    default: 'production'
  })
  .action(async (root: string, options: BuildOptions & GlobalCLIOptions) => {
    const { build } = await import('./build')
    try {
      await build(
        {
          root,
          mode: options.mode,
          logLevel: options.logLevel,
          build: cleanOptions(options) as BuildOptions
        },
        options.config
      )
    } catch (e) {
      const logError = createLogger(options.logLevel).error
      logError(chalk.red(`error during build:\n${e.stack}`))
      process.exit(1)
    }
  })

// optimize
cli
  .command('optimize [root]')
  .option(
    '--force',
    `[boolean]  force the optimizer to ignore the cache and re-bundle`
  )
  .action(
    async (root: string, options: { force?: boolean } & GlobalCLIOptions) => {
      const { optimizeDeps } = await import('./optimizer')
      try {
        const config = await resolveConfig(
          {
            root,
            logLevel: options.logLevel
          },
          'build',
          'development',
          options.config
        )
        await optimizeDeps(config, options.force, true)
      } catch (e) {
        const logError = createLogger(options.logLevel).error
        logError(chalk.red(`error when optimizing deps:\n${e.stack}`))
        process.exit(1)
      }
    }
  )

cli.help()
cli.version(require('../../package.json').version)

cli.parse()
