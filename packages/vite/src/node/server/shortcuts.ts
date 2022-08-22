import colors from 'picocolors'
import type { ViteDevServer } from '..'
import { openBrowser } from './openBrowser'

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
  action(server: ViteDevServer): void | Promise<void>
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
      const url = server.resolvedUrls?.local[0]

      if (!url) {
        return server.config.logger.warn(
          colors.yellow(`cannot open in browser; no server URLs registered.`)
        )
      }

      openBrowser(url, true, server.config.logger)
    }
  },
  {
    key: 'h',
    name: 'toggle hmr',
    action({ config }: ViteDevServer): void {
      /**
       * Mutating the server config works because Vite reads from
       * it on every file change, instead of caching its value.
       *
       * Since `undefined` is treated as `true`, we have to
       * use `!== true` to flip the boolean value.
       */
      config.server.hmr = config.server.hmr !== true
      config.logger.info(
        colors.cyan(`hmr ${config.server.hmr ? `enabled` : `disabled`}`)
      )
    }
  }
]
