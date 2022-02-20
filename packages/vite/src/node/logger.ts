/* eslint no-console: 0 */

import type { AddressInfo, Server } from 'net'
import os from 'os'
import readline from 'readline'
import colors from 'picocolors'
import type { RollupError } from 'rollup'
import type { CommonServerOptions } from './http'
import type { Hostname } from './utils'
import { resolveHostname } from './utils'
import type { ResolvedConfig } from '.'

export type LogType = 'error' | 'warn' | 'info'
export type LogLevel = LogType | 'silent'
export interface Logger {
  info(msg: string, options?: LogOptions): void
  warn(msg: string, options?: LogOptions): void
  warnOnce(msg: string, options?: LogOptions): void
  error(msg: string, options?: LogErrorOptions): void
  clearScreen(type: LogType): void
  hasErrorLogged(error: Error | RollupError): boolean
  hasWarned: boolean
}

export interface LogOptions {
  clear?: boolean
  timestamp?: boolean
}

export interface LogErrorOptions extends LogOptions {
  error?: Error | RollupError | null
}

export const LogLevels: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3
}

let lastType: LogType | undefined
let lastMsg: string | undefined
let sameCount = 0

function clearScreen() {
  const repeatCount = process.stdout.rows - 2
  const blank = repeatCount > 0 ? '\n'.repeat(repeatCount) : ''
  console.log(blank)
  readline.cursorTo(process.stdout, 0, 0)
  readline.clearScreenDown(process.stdout)
}

export interface LoggerOptions {
  prefix?: string
  allowClearScreen?: boolean
  customLogger?: Logger
}

export function createLogger(
  level: LogLevel = 'info',
  options: LoggerOptions = {}
): Logger {
  if (options.customLogger) {
    return options.customLogger
  }

  const loggedErrors = new WeakSet<Error | RollupError>()
  const { prefix = '[vite]', allowClearScreen = true } = options
  const thresh = LogLevels[level]
  const canClearScreen =
    allowClearScreen && process.stdout.isTTY && !process.env.CI
  const clear = canClearScreen ? clearScreen : () => {}

  function output(type: LogType, msg: string, options: LogErrorOptions = {}) {
    if (thresh >= LogLevels[type]) {
      const method = type === 'info' ? 'log' : type
      const format = () => {
        if (options.timestamp) {
          const tag =
            type === 'info'
              ? colors.cyan(colors.bold(prefix))
              : type === 'warn'
              ? colors.yellow(colors.bold(prefix))
              : colors.red(colors.bold(prefix))
          return `${colors.dim(new Date().toLocaleTimeString())} ${tag} ${msg}`
        } else {
          return msg
        }
      }
      if (options.error) {
        loggedErrors.add(options.error)
      }
      if (canClearScreen) {
        if (type === lastType && msg === lastMsg) {
          sameCount++
          clear()
          console[method](format(), colors.yellow(`(x${sameCount + 1})`))
        } else {
          sameCount = 0
          lastMsg = msg
          lastType = type
          if (options.clear) {
            clear()
          }
          console[method](format())
        }
      } else {
        console[method](format())
      }
    }
  }

  const warnedMessages = new Set<string>()

  const logger: Logger = {
    hasWarned: false,
    info(msg, opts) {
      output('info', msg, opts)
    },
    warn(msg, opts) {
      logger.hasWarned = true
      output('warn', msg, opts)
    },
    warnOnce(msg, opts) {
      if (warnedMessages.has(msg)) return
      logger.hasWarned = true
      output('warn', msg, opts)
      warnedMessages.add(msg)
    },
    error(msg, opts) {
      logger.hasWarned = true
      output('error', msg, opts)
    },
    clearScreen(type) {
      if (thresh >= LogLevels[type]) {
        clear()
      }
    },
    hasErrorLogged(error) {
      return loggedErrors.has(error)
    }
  }

  return logger
}

export function printCommonServerUrls(
  server: Server,
  options: CommonServerOptions,
  config: ResolvedConfig
): void {
  const address = server.address()
  const isAddressInfo = (x: any): x is AddressInfo => x?.address
  if (isAddressInfo(address)) {
    const hostname = resolveHostname(options.host)
    const protocol = options.https ? 'https' : 'http'
    printServerUrls(
      hostname,
      protocol,
      address.port,
      config.base,
      config.logger.info
    )
  }
}

function printServerUrls(
  hostname: Hostname,
  protocol: string,
  port: number,
  base: string,
  info: Logger['info']
): void {
  const urls: Array<{ label: string; url: string }> = []

  if (hostname.host === '127.0.0.1') {
    urls.push({
      label: 'Local',
      url: colors.cyan(
        `${protocol}://${hostname.name}:${colors.bold(port)}${base}`
      )
    })

    if (hostname.name !== '127.0.0.1') {
      urls.push({
        label: 'Network',
        url: colors.dim(`use ${colors.white(colors.bold('--host'))} to expose`)
      })
    }
  } else {
    Object.values(os.networkInterfaces())
      .flatMap((nInterface) => nInterface ?? [])
      .filter(
        (detail) =>
          detail &&
          detail.address &&
          // Node < v18
          ((typeof detail.family === 'string' && detail.family === 'IPv4') ||
            // Node >= v18
            (typeof detail.family === 'number' && detail.family === 4))
      )
      .forEach((detail) => {
        const host = detail.address.replace('127.0.0.1', hostname.name)
        const url = `${protocol}://${host}:${colors.bold(port)}${base}`
        const label = detail.address.includes('127.0.0.1') ? 'Local' : 'Network'

        urls.push({ label, url: colors.cyan(url) })
      })
  }

  const length = urls.reduce(
    (length, { label }) => Math.max(length, label.length),
    0
  )
  urls.forEach(({ label, url: text }) => {
    info(
      `  ${colors.green('➜')}  ${colors.bold(label)}: ${' '.repeat(
        length - label.length
      )}${text}`
    )
  })
}
