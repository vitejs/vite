import readline from 'node:readline'
import colors from 'picocolors'
import { restartServerWithUrls } from './server'
import type { ViteDevServer } from './server'
import type { PreviewServer } from './preview'
import { openBrowser } from './server/openBrowser'

export type BindCLIShortcutsOptions<Server = ViteDevServer | PreviewServer> = {
  /**
   * Print a one-line shortcuts "help" hint to the terminal
   */
  print?: boolean
  /**
   * Custom shortcuts to run when a key is pressed. These shortcuts take priority
   * over the default shortcuts if they have the same keys (except the `h` key).
   */
  customShortcuts?: CLIShortcut<Server>[]
}

export type CLIShortcut<Server = ViteDevServer | PreviewServer> = {
  key: string
  description: string
  action(server: Server): void | Promise<void>
}

export function bindCLIShortcuts<Server extends ViteDevServer | PreviewServer>(
  server: Server,
  opts?: BindCLIShortcutsOptions<Server>,
): void {
  if (!server.httpServer || !process.stdin.isTTY || process.env.CI) {
    return
  }

  const isDev = isDevServer(server)

  if (isDev) {
    server._shortcutsOptions = opts as BindCLIShortcutsOptions<ViteDevServer>
  }

  if (opts?.print) {
    server.config.logger.info(
      colors.dim(colors.green('  ➜')) +
        colors.dim('  press ') +
        colors.bold('h + enter') +
        colors.dim(' to show help'),
    )
  }

  const shortcuts = (opts?.customShortcuts ?? [])
    // @ts-expect-error passing the right types, but typescript can't detect it
    .concat(isDev ? BASE_DEV_SHORTCUTS : BASE_PREVIEW_SHORTCUTS)

  let actionRunning = false

  const onInput = async (input: string) => {
    if (actionRunning) return

    if (input === 'h') {
      const loggedKeys = new Set<string>()
      server.config.logger.info('\n  Shortcuts')

      for (const shortcut of shortcuts) {
        if (loggedKeys.has(shortcut.key)) continue
        loggedKeys.add(shortcut.key)

        server.config.logger.info(
          colors.dim('  press ') +
            colors.bold(`${shortcut.key} + enter`) +
            colors.dim(` to ${shortcut.description}`),
        )
      }

      return
    }

    const shortcut = shortcuts.find((shortcut) => shortcut.key === input)
    if (!shortcut) return

    actionRunning = true
    await shortcut.action(server)
    actionRunning = false
  }

  const rl = readline.createInterface({ input: process.stdin })
  rl.on('line', onInput)
  server.httpServer.on('close', () => rl.close())
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
      await restartServerWithUrls(server)
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
      const url =
        server.resolvedUrls?.local[0] ?? server.resolvedUrls?.network[0]
      if (url) {
        openBrowser(url, true, server.config.logger)
      } else {
        server.config.logger.warn('No URL available to open in browser')
      }
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
