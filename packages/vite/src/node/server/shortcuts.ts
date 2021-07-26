import type { ViteDevServer } from '..'
import { openBrowser, resolveBrowserUrl } from './openBrowser'
import { restartServer } from './hmr'

export function bindShortcuts(server: ViteDevServer, isRestart = false): void {
  server.config.logger.info(
    `  > Shortcuts: ` +
      SHORTCUTS.map((shortcut) => {
        return `"${shortcut.key}" ${shortcut.name}`
      }).join(', ')
  )

  if (isRestart) return

  const { stdin } = process
  stdin.resume()
  stdin.setEncoding('utf8')
  stdin.setRawMode(true)
  stdin.on('data', (data) => {
    const input = data.toString().trim().toLowerCase()

    // ctrl+c or ctrl+d
    if (input === '\x03' || input === '\x04') {
      return process.kill(process.pid, 'SIGINT')
    }

    const shortcut = SHORTCUTS.find((shortcut) => shortcut.key === input)
    shortcut?.action(server)
  })
}

export interface Shortcut {
  key: string
  name: string
  action(server: ViteDevServer): void
}

export const SHORTCUTS: Shortcut[] = [
  {
    key: 'r',
    name: 'restart',
    action(server: ViteDevServer): void {
      restartServer(server)
    }
  },
  {
    key: 'o',
    name: 'open browser',
    action(server: ViteDevServer): void {
      openBrowser(resolveBrowserUrl(server), true, server.config.logger)
    }
  },
  {
    key: 'f',
    name: 'force restart',
    action(server: ViteDevServer): void {
      restartServer(server, true)
    }
  }
]
