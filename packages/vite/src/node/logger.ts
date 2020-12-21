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
}

const lastMessages: Record<LogType, any[]> = {
  info: [],
  warn: [],
  error: []
}

const sameCount: Record<LogType, number> = {
  info: 0,
  warn: 0,
  error: 0
}

function sameAsLast(msgs: any[], last: any[]) {
  return msgs.length === last.length && msgs.every((m, i) => m === last[i])
}

export function createLogger(level: LogLevel = 'info'): Logger {
  const thresh = LogLevels[level]

  function output(type: LogType, msgs: any[]) {
    const stream = type === 'info' ? process.stdout : process.stderr
    const method = type === 'info' ? 'log' : type

    if (thresh >= LogLevels[type]) {
      if (sameAsLast(msgs, lastMessages[type])) {
        sameCount[type]++
        // move to the start of the last message and clear it
        readline.moveCursor(stream, 0, -msgs.join('').split('\n').length)
        readline.clearScreenDown(stream)
        // eslint-disable-next-line no-console
        console[method](...msgs, chalk.yellow(`(x${sameCount[type]})`))
      } else {
        sameCount[type] = 0
        lastMessages[type] = msgs
        // eslint-disable-next-line no-console
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
    }
  }
}
