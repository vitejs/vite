import readline from 'node:readline'
import colors from 'picocolors'
import { restartServerWithUrls } from './server'
import type { ViteDevServer } from './server'
import { isDevServer } from './utils'
import type { PreviewServer } from './preview'
import { openBrowser } from './server/openBrowser'

export type ShortcutsState<Server = ViteDevServer | PreviewServer> = {
  rl: readline.Interface
  options: BindCLIShortcutsOptions<Server>
}

export type BindCLIShortcutsOptions<Server = ViteDevServer | PreviewServer> = {
  /**
   * Print a one-line shortcuts "help" hint to the terminal
   */
  print?: boolean
  /**
   * Custom shortcuts to run when a key is pressed. These shortcuts take priority
   * over the default shortcuts if they have the same keys (except the `h` key).
   * To disable a default shortcut, define the same key but with `action: undefined`.
   */
  customShortcuts?: CLIShortcut<Server>[]
}

export type CLIShortcut<Server = ViteDevServer | PreviewServer> = {
  key: string
  description: string
  action?(server: Server): void | Promise<void>
}

export function bindCLIShortcuts<Server extends ViteDevServer | PreviewServer>(
  server: Server,
  opts?: BindCLIShortcutsOptions<Server>,
  enabled: boolean = process.stdin.isTTY && !process.env.CI,
): void {
  if (!server.httpServer || !enabled) {
    return
  }

  const isDev = isDevServer(server)

  // Merge shortcuts: new at top, existing updated in place (keeps manual > plugin order)
  const previousShortcuts =
    server._shortcutsState?.options.customShortcuts ?? []
  const newShortcuts = opts?.customShortcuts ?? []
  const previousKeys = new Set(previousShortcuts.map((s) => s.key))
  const customShortcuts: CLIShortcut<ViteDevServer | PreviewServer>[] = [
    ...newShortcuts.filter((s) => !previousKeys.has(s.key)),
    ...previousShortcuts.map(
      (s) => newShortcuts.find((n) => n.key === s.key) ?? s,
    ),
  ]

  const newOptions: BindCLIShortcutsOptions<Server> = {
    ...opts,
    customShortcuts,
  }

  if (opts?.print) {
    server.config.logger.info(
      colors.dim(colors.green('  ➜')) +
        colors.dim('  press ') +
        colors.bold('h + enter') +
        colors.dim(' to show help'),
    )
  }

  const shortcuts = customShortcuts.concat(
    (isDev
      ? BASE_DEV_SHORTCUTS
      : BASE_PREVIEW_SHORTCUTS) as CLIShortcut<Server>[],
  )

  let actionRunning = false

  const onInput = async (input: string) => {
    if (actionRunning) return

    input = input.trim().toLocaleLowerCase()
    if (input === 'h') {
      const loggedKeys = new Set<string>()
      server.config.logger.info('\n  Shortcuts')

      for (const shortcut of shortcuts) {
        if (loggedKeys.has(shortcut.key)) continue
        loggedKeys.add(shortcut.key)

        if (shortcut.action == null) continue

        server.config.logger.info(
          colors.dim('  press ') +
            colors.bold(`${shortcut.key} + enter`) +
            colors.dim(` to ${shortcut.description}`),
        )
      }

      return
    }

    const shortcut = shortcuts.find((shortcut) => shortcut.key === input)
    if (!shortcut || shortcut.action == null) return

    actionRunning = true
    await shortcut.action(server)
    actionRunning = false
  }

  if (!server._shortcutsState) {
    ;(server._shortcutsState as unknown as ShortcutsState<Server>) = {
      rl: readline.createInterface({ input: process.stdin }),
      options: newOptions,
    }
    server.httpServer.on('close', () => {
      // Skip if detached during restart (readline is reused)
      if (server._shortcutsState) server._shortcutsState.rl.close()
    })
  } else {
    server._shortcutsState.rl.removeAllListeners('line')
    ;(server._shortcutsState.options as BindCLIShortcutsOptions<Server>) =
      newOptions
  }

  server._shortcutsState!.rl.on('line', onInput)
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
      try {
        await server.close()
      } finally {
        process.exit()
      }
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
    async action(server) {
      try {
        await server.close()
      } finally {
        process.exit()
      }
    },
  },
]
