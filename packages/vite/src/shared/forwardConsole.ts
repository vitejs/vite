import type { ForwardConsolePayload } from '#types/customEvent'
import type { NormalizedModuleRunnerTransport } from './moduleRunnerTransport'

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

export function setupForwardConsoleHandler(
  transport: NormalizedModuleRunnerTransport,
  options: ResolvedForwardConsoleOptions,
): void {
  if (!options.enabled) {
    return
  }

  function sendError(type: 'error' | 'unhandled-rejection', error: any) {
    transport.send({
      type: 'custom',
      event: 'vite:forward-console',
      data: {
        type,
        data: {
          name: error?.name || 'Unknown Error',
          message: error?.message || String(error),
          stack: error?.stack,
        },
      } satisfies ForwardConsolePayload,
    })
  }

  function sendLog(level: ForwardConsoleLogLevel, args: unknown[]) {
    transport.send({
      type: 'custom',
      event: 'vite:forward-console',
      data: {
        type: 'log',
        data: {
          level,
          message: formatConsoleArgs(args),
        },
      } satisfies ForwardConsolePayload,
    })
  }

  for (const level of options.logLevels) {
    const original = console[level].bind(console)
    console[level] = (...args: unknown[]) => {
      original(...args)
      sendLog(level, args)
    }
  }

  if (options.unhandledErrors && typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      // `ErrorEvent` doesn't necessarily have `ErrorEvent.error`.
      // Use `ErrorEvent.message` as fallback e.g. for ResizeObserver error.
      // https://developer.mozilla.org/en-US/docs/Web/API/ErrorEvent/error
      // https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver#observation_errors
      const error =
        event.error ?? (event.message ? new Error(event.message) : event)
      sendError('error', error)
    })

    window.addEventListener('unhandledrejection', (event) => {
      sendError('unhandled-rejection', event.reason)
    })
  }
}

export function formatConsoleArgs(args: unknown[]): string {
  if (args.length === 0) {
    return ''
  }

  if (typeof args[0] !== 'string') {
    return args.map((arg) => stringifyConsoleArg(arg)).join(' ')
  }

  const len = args.length
  let i = 1
  let message = args[0].replace(/%[sdjifoOc%]/g, (specifier) => {
    if (specifier === '%%') {
      return '%'
    }
    if (i >= len) {
      return specifier
    }

    const arg = args[i++]
    switch (specifier) {
      case '%s':
        if (typeof arg === 'bigint') {
          return `${arg.toString()}n`
        }
        return typeof arg === 'object' && arg !== null
          ? stringifyConsoleArg(arg)
          : String(arg)
      case '%d':
        if (typeof arg === 'bigint') {
          return `${arg.toString()}n`
        }
        if (typeof arg === 'symbol') {
          return 'NaN'
        }
        return Number(arg).toString()
      case '%i':
        if (typeof arg === 'bigint') {
          return `${arg.toString()}n`
        }
        return Number.parseInt(String(arg), 10).toString()
      case '%f':
        return Number.parseFloat(String(arg)).toString()
      case '%o':
      case '%O':
        return stringifyConsoleArg(arg)
      case '%j':
        try {
          const serialized = JSON.stringify(arg)
          return serialized ?? 'undefined'
        } catch {
          return '[Circular]'
        }
      case '%c':
        return ''
      default:
        return specifier
    }
  })

  for (let arg = args[i]; i < len; arg = args[++i]) {
    if (arg === null || typeof arg !== 'object') {
      message += ` ${typeof arg === 'symbol' ? arg.toString() : String(arg)}`
    } else {
      message += ` ${stringifyConsoleArg(arg)}`
    }
  }

  return message
}

function stringifyConsoleArg(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'undefined'
  ) {
    return String(value)
  }
  if (typeof value === 'symbol') {
    return value.toString()
  }
  if (typeof value === 'function') {
    return value.name ? `[Function: ${value.name}]` : '[Function]'
  }
  if (value instanceof Error) {
    return value.stack || `${value.name}: ${value.message}`
  }
  if (typeof value === 'bigint') {
    return `${value}n`
  }

  const seen = new WeakSet<object>()
  try {
    const serialized = JSON.stringify(value, (_, nested) => {
      if (typeof nested === 'bigint') {
        return `${nested}n`
      }
      if (nested instanceof Error) {
        return {
          name: nested.name,
          message: nested.message,
          stack: nested.stack,
        }
      }
      if (nested && typeof nested === 'object') {
        if (seen.has(nested)) {
          return '[Circular]'
        }
        seen.add(nested)
      }
      return nested
    })
    return serialized ?? String(value)
  } catch {
    return String(value)
  }
}
