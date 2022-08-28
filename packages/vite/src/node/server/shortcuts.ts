import colors from 'picocolors'
import type { ViteDevServer } from '..'
import { openBrowser } from './openBrowser'

export function bindShortcuts(server: ViteDevServer): void {
  if (!server.httpServer) return

  const helpInfo =
    colors.dim('press ') +
    colors.reset(colors.bold('h')) +
    colors.dim(' to show help')
  const quitInfo =
    colors.dim('press ') +
    colors.reset(colors.bold('q')) +
    colors.dim(' to quit')

  server.config.logger.info(
    colors.dim(`  ${colors.green('➜')}  ${helpInfo}, ${quitInfo}`)
  )

  let actionRunning = false

  const onInput = async (input: string) => {
    // ctrl+c or ctrl+d
    if (input === '\x03' || input === '\x04') {
      return process.kill(process.pid, 'SIGINT')
    }

    if (input === 'h') {
      return server.config.logger.info(
        SHORTCUTS.map(
          (shortcut) =>
            colors.dim('  press ') +
            colors.reset(colors.bold(shortcut.key)) +
            colors.dim(` to ${shortcut.description}`)
        ).join('\n')
      )
    }

    const shortcut = SHORTCUTS.find((shortcut) => shortcut.key === input)

    if (!shortcut) {
      return
    }

    if (actionRunning) {
      return
    }

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

export interface Shortcut {
  key: string
  description: string
  action(server: ViteDevServer): void | Promise<void>
}

export const SHORTCUTS: Shortcut[] = [
  {
    key: 'r',
    description: 'restart the server',
    action(server: ViteDevServer): Promise<void> {
      return server.restart()
    }
  },
  {
    key: 'o',
    description: 'open in browser',
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
    key: 'm',
    description: 'toggle hmr on/off',
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
        colors.cyan(`  hmr ${config.server.hmr ? `enabled` : `disabled`}`)
      )
    }
  },
  {
    key: 'q',
    description: 'quit',
    action(server: ViteDevServer): void {
      server.close()
    }
  }
]
