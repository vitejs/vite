import type { ViteDevServer } from '..'
import { openBrowser, resolveBrowserUrl } from './openBrowser'

export function bindShortcuts(server: ViteDevServer): void {
  if (!server.httpServer) return

  server.config.logger.info(
    `  > Shortcuts: ` +
      SHORTCUTS.map((shortcut) => {
        return `"${shortcut.key}" ${shortcut.name}`
      }).join(', ')
  )

  const onInput = (input: string) => {
    // ctrl+c or ctrl+d
    if (input === '\x03' || input === '\x04') {
      return process.kill(process.pid, 'SIGINT')
    }
    const shortcut = SHORTCUTS.find((shortcut) => shortcut.key === input)
    shortcut?.action(server)
  }

  process.stdin
    .on('data', onInput)
    .setEncoding('utf8')
    .setRawMode(true)
    .resume()

  server.httpServer.on('close', () => {
    process.stdin.off('data', onInput).pause()
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
      server.restart()
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
      server.restart(true)
    }
  }
]
