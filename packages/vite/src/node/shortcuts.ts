import colors from 'picocolors'
import type { ViteDevServer } from './server'
import { openBrowser } from './server/openBrowser'
import type { HmrOptions } from './server/hmr'
import { isDefined } from './utils'

export type BindShortcutsOptions = {
  /**
   * Print a one line hint to the terminal.
   */
  print?: boolean
  additionalShortCuts?: (CLIShortcut | undefined | null)[]
}

export type CLIShortcut = {
  key: string
  description: string
  action(server: ViteDevServer): void | Promise<void>
}

export function bindShortcuts(
  server: ViteDevServer,
  opts: BindShortcutsOptions,
): void {
  if (!server.httpServer) return

  if (opts.print) {
    server.config.logger.info(
      colors.dim(colors.green('  ➜')) +
        colors.dim('  press ') +
        colors.bold('h') +
        colors.dim(' to show help'),
    )
  }

  const shortcuts = (opts.additionalShortCuts ?? [])
    .filter(isDefined)
    .concat(BASE_SHORTCUTS)

  let actionRunning = false

  const onInput = async (input: string) => {
    // ctrl+c or ctrl+d
    if (input === '\x03' || input === '\x04') {
      process.emit('SIGTERM')
      return
    }

    if (actionRunning) return

    if (input === 'h') {
      server.config.logger.info(
        shortcuts
          .map(
            (shortcut) =>
              colors.dim('  press ') +
              colors.bold(shortcut.key) +
              colors.dim(` to ${shortcut.description}`),
          )
          .join('\n'),
      )
    }

    const shortcut = shortcuts.find((shortcut) => shortcut.key === input)
    if (!shortcut) return

    actionRunning = true
    await shortcut.action(server)
    actionRunning = false
  }

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
  }

  process.stdin.on('data', onInput).setEncoding('utf8').resume()

  server.httpServer.on('close', () => {
    process.stdin.off('data', onInput).pause()
  })
}

let initialHmrOptions: HmrOptions | boolean

const BASE_SHORTCUTS: CLIShortcut[] = [
  {
    key: 'r',
    description: 'restart the server',
    async action(server) {
      await server.restart()
    },
  },
  {
    key: 'o',
    description: 'open in browser',
    action(server) {
      const url = server.resolvedUrls?.local[0]

      if (!url) {
        server.config.logger.warn('No URL available to open in browser')
        return
      }

      openBrowser(url, true, server.config.logger)
    },
  },
  {
    key: 'm',
    description: 'toggle hmr on/off',
    action({ config }: ViteDevServer): void {
      if (initialHmrOptions === undefined) {
        initialHmrOptions = config.server.hmr ?? true
      }
      /**
       * Mutating the server config works because Vite reads from
       * it on every file change, instead of caching its value.
       */
      config.server.hmr =
        config.server.hmr === false
          ? initialHmrOptions === false
            ? true
            : initialHmrOptions
          : false
      config.logger.info(
        colors.cyan(`hmr ${config.server.hmr ? `enabled` : `disabled`}`),
      )
    },
  },
  {
    key: 'q',
    description: 'quit',
    async action(server) {
      await server.close().finally(() => process.exit())
    },
  },
]
