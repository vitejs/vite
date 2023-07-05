import colors from 'picocolors'
import type { ViteDevServer } from './server'
import { isDefined } from './utils'
import type { PreviewServer } from './preview'
import { openBrowser } from './server/openBrowser'

export type BindShortcutsOptions<Server = ViteDevServer | PreviewServer> = {
  /**
   * Print a one line hint to the terminal.
   */
  print?: boolean
  customShortcuts?: (CLIShortcut<Server> | undefined | null)[]
}

export type CLIShortcut<Server = ViteDevServer | PreviewServer> = {
  key: string
  description: string
  action(server: Server): void | Promise<void>
}

export function bindShortcuts<Server extends ViteDevServer | PreviewServer>(
  server: Server,
  opts?: BindShortcutsOptions<Server>,
): void {
  if (!server.httpServer || !process.stdin.isTTY || process.env.CI) {
    return
  }

  const isDev = isDevServer(server)

  if (isDev) {
    server._shortcutsOptions = opts
  }

  if (opts?.print) {
    server.config.logger.info(
      colors.dim(colors.green('  ➜')) +
        colors.dim('  press ') +
        colors.bold('h') +
        colors.dim(' to show help'),
    )
  }

  const shortcuts = (opts?.customShortcuts ?? [])
    .filter(isDefined)
    // @ts-expect-error passing the right types, but typescript can't detect it
    .concat(isDev ? BASE_DEV_SHORTCUTS : BASE_PREVIEW_SHORTCUTS)

  let actionRunning = false

  const onInput = async (input: string) => {
    // ctrl+c or ctrl+d
    if (input === '\x03' || input === '\x04') {
      try {
        if (isDev) {
          await server.close()
        } else {
          server.httpServer.close()
        }
      } finally {
        process.exit(1)
      }
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

function isDevServer(
  server: ViteDevServer | PreviewServer,
): server is ViteDevServer {
  return 'pluginContainer' in server
}

const BASE_DEV_SHORTCUTS: CLIShortcut<ViteDevServer>[] = [
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
      server.openBrowser()
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

const BASE_PREVIEW_SHORTCUTS: CLIShortcut<PreviewServer>[] = [
  {
    key: 'o',
    description: 'open in browser',
    action(server) {
      const url = server.resolvedUrls.local[0] ?? server.resolvedUrls.network[0]
      openBrowser(url, true, server.config.logger)
    },
  },
  {
    key: 'q',
    description: 'quit',
    action(server) {
      try {
        server.httpServer.close()
      } finally {
        process.exit()
      }
    },
  },
]
