/* eslint no-console: 0 */

import chalk from 'chalk'
import readline from 'readline'

export type LogType = 'error' | 'warn' | 'info'
export type LogLevel = LogType | 'silent'
export interface Logger {
  info(msg: string, options?: LogOptions): void
  warn(msg: string, options?: LogOptions): void
  error(msg: string, options?: LogOptions): void
  clearScreen(type: LogType): void
  hasWarned: boolean
}

export interface LogOptions {
  clear?: boolean
  timestamp?: boolean
}

const LogLevels: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3
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

export function createLogger(
  level: LogLevel = 'info',
  allowClearScreen = true
): Logger {
  const thresh = LogLevels[level]
  const clear = allowClearScreen && !process.env.CI ? clearScreen : () => {}

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
          return `${chalk.dim(new Date().toLocaleTimeString())} ${tag} ${msg}`
        } else {
          return msg
        }
      }
      if (type === lastType && msg === lastMsg) {
        sameCount++
        clear()
        console[method](format(), chalk.yellow(`(x${sameCount + 1})`))
      } else {
        sameCount = 0
        lastMsg = msg
        lastType = type
        if (options.clear) {
          clear()
        }
        console[method](format())
      }
    }
  }

  const logger: Logger = {
    hasWarned: false,
    info(msg, opts) {
      output('info', msg, opts)
    },
    warn(msg, opts) {
      logger.hasWarned = true
      output('warn', msg, opts)
    },
    error(msg, opts) {
      logger.hasWarned = true
      output('error', msg, opts)
    },
    clearScreen(type) {
      if (thresh >= LogLevels[type]) {
        clear()
      }
    }
  }

  return logger
}
