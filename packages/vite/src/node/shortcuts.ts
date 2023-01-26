import colors from 'picocolors'
import type { ViteDevServer } from './server'
import { openBrowser } from './server/openBrowser'
import { isDefined } from './utils'

export type BindShortcutsOptions = {
  /**
   * Print a one line hint to the terminal.
   */
  print?: boolean
  customShortcuts?: (CLIShortcut | undefined | null)[]
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
  if (!server.httpServer || !process.stdin.isTTY || process.env.CI) {
    return
  }
  server._shortcutsOptions = opts

  if (opts.print) {
    server.config.logger.info(
      colors.dim(colors.green('  ➜')) +
        colors.dim('  press ') +
        colors.bold('h') +
        colors.dim(' to show help'),
    )
  }

  const shortcuts = (opts.customShortcuts ?? [])
    .filter(isDefined)
    .concat(BASE_SHORTCUTS)

  let actionRunning = false

  const onInput = async (input: string) => {
    // ctrl+c or ctrl+d
    if (input === '\x03' || input === '\x04') {
      await server.close().finally(() => process.exit(1))
      return
    }

    if (actionRunning) return

    if (input === 'h') {
      server.config.logger.info(
        [
          '',
          colors.bold('  Shortcuts'),
          ...shortcuts.map(
            (shortcut) =>
              colors.dim('  press ') +
              colors.bold(shortcut.key) +
              colors.dim(` to ${shortcut.description}`),
          ),
        ].join('\n'),
      )
    }

    const shortcut = shortcuts.find((shortcut) => shortcut.key === input)
    if (!shortcut) return

    actionRunning = true
    await shortcut.action(server)
    actionRunning = false
  }

  process.stdin.setRawMode(true)

  process.stdin.on('data', onInput).setEncoding('utf8').resume()

  server.httpServer.on('close', () => {
    process.stdin.off('data', onInput).pause()
  })
}

const BASE_SHORTCUTS: CLIShortcut[] = [
  {
    key: 'r',
    description: 'restart the server',
    async action(server) {
      await server.restart()
    },
  },
  {
    key: 'u',
    description: 'show server url',
    action(server) {
      server.config.logger.info('')
      server.printUrls()
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
    key: 'c',
    description: 'clear console',
    action(server) {
      server.config.logger.clearScreen('error')
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
