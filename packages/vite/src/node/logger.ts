export type LogLevel = 'silent' | 'error' | 'warning' | 'info'

const LogLevels: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warning: 2,
  info: 3
}

export interface Logger {
  info(...msgs: any[]): void
  warn(...msgs: any[]): void
  error(...msgs: any[]): void
}

export function createLogger(level: LogLevel = 'info'): Logger {
  const thresh = LogLevels[level]
  return {
    info(...msgs) {
      if (thresh >= LogLevels.info) {
        // eslint-disable-next-line no-console
        console.log(...msgs)
      }
    },
    warn(...msgs) {
      if (thresh >= LogLevels.warning) {
        // eslint-disable-next-line no-console
        console.warn(...msgs)
      }
    },
    error(...msgs) {
      if (thresh >= LogLevels.error) {
        // eslint-disable-next-line no-console
        console.error(...msgs)
      }
    }
  }
}
