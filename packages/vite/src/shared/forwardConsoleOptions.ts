// TODO: should be in config.ts?

export type ForwardConsoleLogLevel = 'error' | 'warn' | 'info' | 'log' | 'debug'

export interface ForwardConsoleOptions {
  unhandledErrors?: boolean
  logLevels?: ForwardConsoleLogLevel[]
}

export interface ResolvedForwardConsoleOptions {
  enabled: boolean
  unhandledErrors: boolean
  logLevels: ForwardConsoleLogLevel[]
}

export function resolveForwardConsoleOptions(
  value: boolean | ForwardConsoleOptions | undefined,
): ResolvedForwardConsoleOptions {
  if (!value) {
    return {
      enabled: false,
      unhandledErrors: false,
      logLevels: [],
    }
  }

  if (value === true) {
    return {
      enabled: true,
      unhandledErrors: true,
      logLevels: ['error', 'warn'],
    }
  }

  const unhandledErrors = value.unhandledErrors ?? true
  const logLevels = value.logLevels ?? []

  return {
    enabled: unhandledErrors || logLevels.length > 0,
    unhandledErrors,
    logLevels,
  }
}
