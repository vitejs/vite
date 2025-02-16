import path from 'node:path'
import fs from 'node:fs'
import { performance } from 'node:perf_hooks'
import colors from 'picocolors'
import {
  type CustomType,
  type TopLevelOptions,
  generateHelpMessage,
  parse,
} from 'ordana'
import { parseArgs } from '@pkgjs/parseargs'
import { VERSION } from './constants'
import type { CLIShortcut } from './shortcuts'
import type { LogLevel } from './logger'
import { createLogger } from './logger'
import { resolveConfig } from './config'
import type { InlineConfig } from './config'

let profileSession = global.__vite_profile_session
let profileCount = 0

export const stopProfiler = (
  log: (message: string) => void,
): void | Promise<void> => {
  if (!profileSession) return
  return new Promise((res, rej) => {
    profileSession!.post('Profiler.stop', (err: any, { profile }: any) => {
      // Write profile to disk, upload, etc.
      if (!err) {
        const outPath = path.resolve(
          `./vite-profile-${profileCount++}.cpuprofile`,
        )
        fs.writeFileSync(outPath, JSON.stringify(profile))
        log(
          colors.yellow(
            `CPU profile written to ${colors.white(colors.dim(outPath))}`,
          ),
        )
        profileSession = undefined
        res()
      } else {
        rej(err)
      }
    })
  })
}

const numberType = {
  type: 'string',
  parse: (value) => +value,
  docsType: 'number',
} satisfies CustomType

export const cliOptions = {
  name: 'vite',
  allowKebabCaseAsCamelCaseArguments: true,
  globalArguments: {
    config: {
      type: 'string',
      short: 'c',
      placeholder: 'file',
      description: 'Use specified config file',
    },
    base: {
      type: 'string',
      placeholder: 'path',
      description: 'Public base path (default: /)',
    },
    logLevel: {
      type: {
        type: 'string',
        parse: (value) => value as LogLevel,
        docsType: 'error | warn | info | silent',
      },
      short: 'l',
      placeholder: 'level',
      description: 'Determine which logs to output.',
    },
    clearScreen: {
      type: 'boolean',
      description: 'Allow/disable clear screen when logging',
    },
    configLoader: {
      type: {
        type: 'string',
        parse: (value) => value as 'bundle' | 'runner' | 'native',
        docsType: 'bundle | runner | native',
      },
      description:
        "Use 'bundle' to bundle the config with esbuild, or 'runner' (experimental) to process it on the fly, or 'native' (experimental) to load using the native runtime (default: bundle)",
    },
    debug: {
      type: 'string|boolean',
      short: 'd',
      placeholder: 'feat',
      description: 'Show debug logs',
    },
    filter: {
      type: 'string',
      short: 'f',
      description: 'Filter debug logs',
    },
    mode: {
      type: 'string',
      short: 'm',
      description: 'Set env mode',
    },
    profile: {
      type: 'boolean',
      description: 'Start built-in Node.js inspector',
    },
  },
  defaultSubcommand: 'dev',
  subcommands: {
    dev: {
      positionals: {
        placeholders: ['root'],
      },
      arguments: {
        host: {
          type: 'string|boolean',
          description: 'Specify hostname',
        },
        port: {
          type: numberType,
          description: 'Specify port',
        },
        open: {
          type: 'string|boolean',
          placeholder: 'path',
          description: 'Open browser on startup',
        },
        cors: {
          type: 'boolean',
          description: 'Enable CORS',
        },
        strictPort: {
          type: 'boolean',
          description: 'Exit if specified port is already in use',
        },
        force: {
          type: 'boolean',
          description: 'Force the optimizer to ignore the cache and re-bundle',
        },
      },
      alias: ['serve'], // the command is called 'serve' in Vite's API
      description: 'Start dev server',
    },
    build: {
      positionals: {
        placeholders: ['root'],
      },
      arguments: {
        target: {
          type: 'string',
          description: "Transpile target (default: 'modules')",
        },
        outDir: {
          type: 'string',
          placeholder: 'dir',
          description: 'Output directory (default: dist)',
        },
        assetsDir: {
          type: 'string',
          placeholder: 'dir',
          description:
            'Directory under outDir to place assets in (default: assets)',
        },
        assetsInlineLimit: {
          type: numberType,
          placeholder: 'number',
          description:
            'Static asset base64 inline threshold in bytes (default: 4096)',
        },
        ssr: {
          type: 'string|boolean',
          placeholder: 'entry',
          description: 'Build specified entry for server-side rendering',
        },
        sourcemap: {
          type: {
            type: 'string|boolean',
            parse: (value) => {
              if (typeof value === 'boolean') {
                return value
              }
              if (value === 'true' || value === 'false') {
                return value === 'true'
              }
              return value as 'inline' | 'hidden'
            },
            docsType: 'boolean | "inline" | "hidden"',
          },
          placeholder: 'output',
          description: 'Output source maps for build (default: false)',
        },
        minify: {
          type: {
            type: 'string|boolean',
            parse: (value) => {
              if (typeof value === 'boolean') {
                return value
              }
              if (value === 'true' || value === 'false') {
                return value === 'true'
              }
              return value as 'terser' | 'esbuild'
            },
            docsType: 'boolean | "terser" | "esbuild"',
          },
          placeholder: 'minifier',
          description:
            'Enable/disable minification, or specify minifier to use (default: esbuild)',
        },
        manifest: {
          type: 'string|boolean',
          placeholder: 'name',
          description: 'Emit build manifest json',
        },
        ssrManifest: {
          type: 'string|boolean',
          placeholder: 'name',
          description: 'Emit ssr manifest json',
        },
        emptyOutDir: {
          type: 'boolean',
          description: "Force empty outDir when it's outside of root",
        },
        watch: {
          type: 'boolean',
          short: 'w',
          description: 'Rebuilds when modules have changed on disk',
        },
        app: {
          type: 'boolean',
          description: 'Same as `builder: {}`',
        },
      },
      description: 'Build for production',
    },
    optimize: {
      positionals: {
        placeholders: ['root'],
      },
      arguments: {
        force: {
          type: 'boolean',
          description: 'Force the optimizer to ignore the cache and re-bundle',
        },
      },
      description:
        'Pre-bundle dependencies (deprecated, the pre-bundle process runs automatically and does not need to be called)',
    },
    preview: {
      positionals: {
        placeholders: ['root'],
      },
      arguments: {
        host: {
          type: 'string|boolean',
          description: 'Specify hostname',
        },
        port: {
          type: numberType,
          description: 'Specify port',
        },
        strictPort: {
          type: 'boolean',
          description: 'Exit if specified port is already in use',
        },
        open: {
          type: 'string|boolean',
          placeholder: 'path',
          description: 'Open browser on startup',
        },
        outDir: {
          type: 'string',
          placeholder: 'dir',
          description: 'Output directory (default: dist)',
        },
      },
      description: 'Locally preview production build',
    },
  },
} satisfies TopLevelOptions

export async function runCli(args: string[]): Promise<void> {
  if (args[0] === '--version') {
    // eslint-disable-next-line no-console
    console.log(`vite/v${VERSION}`)
    return
  }

  const result = parse(args, cliOptions, { parseArgsFunc: parseArgs })
  if (result.type === 'help') {
    const message = generateHelpMessage(cliOptions, result.targetSubcommand)
    // eslint-disable-next-line no-console
    console.log(message)
  } else if (result.type === 'normal') {
    if (result.subcommand === 'dev') {
      const [root] = result.positionals
      const options = result.values

      // output structure is preserved even after bundling so require()
      // is ok here
      const { createServer } = await import('./server')
      try {
        const server = await createServer({
          root,
          base: options.base,
          mode: options.mode,
          configFile: options.config,
          configLoader: options.configLoader,
          logLevel: options.logLevel,
          clearScreen: options.clearScreen,
          server: {
            host: options.host,
            port: options.port,
            open: options.open,
            cors: options.cors,
            strictPort: options.strictPort,
          },
          forceOptimizeDeps: options.force,
        })

        if (!server.httpServer) {
          throw new Error('HTTP server not available')
        }

        await server.listen()

        const info = server.config.logger.info

        const viteStartTime = global.__vite_start_time ?? false
        const startupDurationString = viteStartTime
          ? colors.dim(
              `ready in ${colors.reset(
                colors.bold(Math.ceil(performance.now() - viteStartTime)),
              )} ms`,
            )
          : ''
        const hasExistingLogs =
          process.stdout.bytesWritten > 0 || process.stderr.bytesWritten > 0

        info(
          `\n  ${colors.green(
            `${colors.bold('VITE')} v${VERSION}`,
          )}  ${startupDurationString}\n`,
          {
            clear: !hasExistingLogs,
          },
        )

        server.printUrls()
        const customShortcuts: CLIShortcut<typeof server>[] = []
        if (profileSession) {
          customShortcuts.push({
            key: 'p',
            description: 'start/stop the profiler',
            async action(server) {
              if (profileSession) {
                await stopProfiler(server.config.logger.info)
              } else {
                const inspector = await import('node:inspector').then(
                  (r) => r.default,
                )
                await new Promise<void>((res) => {
                  profileSession = new inspector.Session()
                  profileSession.connect()
                  profileSession.post('Profiler.enable', () => {
                    profileSession!.post('Profiler.start', () => {
                      server.config.logger.info('Profiler started')
                      res()
                    })
                  })
                })
              }
            },
          })
        }
        server.bindCLIShortcuts({ print: true, customShortcuts })
      } catch (e) {
        const logger = createLogger(options.logLevel)
        logger.error(
          colors.red(`error when starting dev server:\n${e.stack}`),
          {
            error: e,
          },
        )
        stopProfiler(logger.info)
        process.exit(1)
      }
    } else if (result.subcommand === 'build') {
      const [root] = result.positionals
      const options = result.values
      const { createBuilder } = await import('./build')

      try {
        const inlineConfig: InlineConfig = {
          root,
          base: options.base,
          mode: options.mode,
          configFile: options.config,
          configLoader: options.configLoader,
          logLevel: options.logLevel,
          clearScreen: options.clearScreen,
          build: {
            target: options.target,
            outDir: options.outDir,
            assetsDir: options.assetsDir,
            assetsInlineLimit: options.assetsInlineLimit,
            ssr: options.ssr,
            sourcemap: options.sourcemap,
            minify: options.minify,
            manifest: options.manifest,
            ssrManifest: options.ssrManifest,
            emptyOutDir: options.emptyOutDir,
            watch: options.watch === true ? {} : undefined,
          },
          ...(options.app ? { builder: {} } : {}),
        }
        const builder = await createBuilder(inlineConfig, null)
        await builder.buildApp()
      } catch (e) {
        createLogger(options.logLevel).error(
          colors.red(`error during build:\n${e.stack}`),
          { error: e },
        )
        process.exit(1)
      } finally {
        stopProfiler((message) => createLogger(options.logLevel).info(message))
      }
    } else if (result.subcommand === 'optimize') {
      const [root] = result.positionals
      const options = result.values

      const { optimizeDeps } = await import('./optimizer')
      try {
        const config = await resolveConfig(
          {
            root,
            base: options.base,
            configFile: options.config,
            configLoader: options.configLoader,
            logLevel: options.logLevel,
            mode: options.mode,
          },
          'serve',
        )
        await optimizeDeps(config, options.force, true)
      } catch (e) {
        createLogger(options.logLevel).error(
          colors.red(`error when optimizing deps:\n${e.stack}`),
          { error: e },
        )
        process.exit(1)
      }
    } else if (result.subcommand === 'preview') {
      const [root] = result.positionals
      const options = result.values

      const { preview } = await import('./preview')
      try {
        const server = await preview({
          root,
          base: options.base,
          configFile: options.config,
          configLoader: options.configLoader,
          logLevel: options.logLevel,
          mode: options.mode,
          build: {
            outDir: options.outDir,
          },
          preview: {
            host: options.host,
            port: options.port,
            strictPort: options.strictPort,
            open: options.open,
          },
        })
        server.printUrls()
        server.bindCLIShortcuts({ print: true })
      } catch (e) {
        createLogger(options.logLevel).error(
          colors.red(`error when starting preview server:\n${e.stack}`),
          { error: e },
        )
        process.exit(1)
      } finally {
        stopProfiler((message) => createLogger(options.logLevel).info(message))
      }
    }
  }
}
