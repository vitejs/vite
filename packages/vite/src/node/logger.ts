/* eslint no-console: 0 */

import chalk from 'chalk'
import readline from 'readline'

export type LogType = 'error' | 'warn' | 'info'
export type LogLevel = LogType | 'silent'

const LogLevels: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3
}

export interface Logger {
  info(...msgs: any[]): void
  warn(...msgs: any[]): void
  error(...msgs: any[]): void
  clearScreen(): void
}

let lastType: LogType | undefined
let lastMsg: any[] = []
let sameCount = 0

function sameAsLast(msgs: any[], last: any[]) {
  return msgs.length === last.length && msgs.every((m, i) => m === last[i])
}

function clearScreen() {
  const blank = '\n'.repeat(process.stdout.rows - 1)
  console.log(blank)
  readline.cursorTo(process.stdout, 0, 0)
  readline.clearScreenDown(process.stdout)
}

export function createLogger(level: LogLevel = 'info'): Logger {
  const thresh = LogLevels[level]

  function output(type: LogType, msgs: any[]) {
    const method = type === 'info' ? 'log' : type
    if (thresh >= LogLevels[type]) {
      if (type === lastType && sameAsLast(msgs, lastMsg)) {
        sameCount++
        clearScreen()
        console[method](...msgs, chalk.yellow(`(x${sameCount + 1})`))
      } else {
        sameCount = 0
        lastMsg = msgs
        lastType = type
        console[method](...msgs)
      }
    }
  }

  return {
    info(...msgs) {
      output('info', msgs)
    },
    warn(...msgs) {
      output('warn', msgs)
    },
    error(...msgs) {
      output('error', msgs)
    },
    clearScreen
  }
}
