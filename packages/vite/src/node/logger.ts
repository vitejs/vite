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
  info(msg: string, options?: LogOptions): void
  warn(msg: string, options?: LogOptions): void
  error(msg: string, options?: LogOptions): void
  clearScreen(type: LogType): void
}

let lastType: LogType | undefined
let lastMsg: string | undefined
let sameCount = 0

function clearScreen() {
  const blank = '\n'.repeat(process.stdout.rows - 2)
  console.log(blank)
  readline.cursorTo(process.stdout, 0, 0)
  readline.clearScreenDown(process.stdout)
}

interface LogOptions {
  clear?: boolean
  timestamp?: boolean
}

export function createLogger(level: LogLevel = 'info'): Logger {
  const thresh = LogLevels[level]

  function output(type: LogType, msg: string, options: LogOptions = {}) {
    if (thresh >= LogLevels[type]) {
      const method = type === 'info' ? 'log' : type
      const format = () => {
        if (options.timestamp) {
          const tag =
            type === 'info'
              ? chalk.cyan.bold(`[vite]`)
              : type === 'warn'
              ? chalk.yellow.bold(`[vite]`)
              : chalk.red.bold(`[vite]`)
          return `${chalk.dim(
            new Date().toLocaleString().split(', ')[1]
          )} ${tag} ${msg}`
        } else {
          return msg
        }
      }
      if (type === lastType && msg === lastMsg) {
        sameCount++
        clearScreen()
        console[method](format(), chalk.yellow(`(x${sameCount + 1})`))
      } else {
        sameCount = 0
        lastMsg = msg
        lastType = type
        if (options.clear) {
          clearScreen()
        }
        console[method](format())
      }
    }
  }

  return {
    info(msg, opts) {
      output('info', msg, opts)
    },
    warn(msg, opts) {
      output('warn', msg, opts)
    },
    error(msg, opts) {
      output('error', msg, opts)
    },
    clearScreen(type) {
      if (thresh >= LogLevels[type]) {
        clearScreen()
      }
    }
  }
}
