import type { ForwardConsolePayload } from '#types/customEvent'
import type { NormalizedModuleRunnerTransport } from './moduleRunnerTransport'
import type {
  ForwardConsoleLogLevel,
  ResolvedForwardConsoleOptions,
} from './forwardConsoleOptions'

export function setupForwardConsoleHandler(
  transport: NormalizedModuleRunnerTransport,
  options: ResolvedForwardConsoleOptions,
): void {
  function sendError(type: 'error' | 'unhandled-rejection', error: any) {
    // TODO: serialize extra properties, recursive cause, etc.
    transport.send({
      type: 'custom',
      event: 'vite:forward-console',
      data: {
        type,
        data: {
          name: error?.name || 'Error',
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
          message: args.map((arg) => stringifyConsoleArg(arg)).join(' '),
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
    const recentUnhandledRejections = new WeakSet<object>()
    const recentUnhandledRejectionMessages = new Set<string>()

    const rememberUnhandledRejection = (reason: unknown) => {
      if (reason && typeof reason === 'object') {
        recentUnhandledRejections.add(reason)
      } else {
        const key = String(reason)
        recentUnhandledRejectionMessages.add(key)
        queueMicrotask(() => {
          recentUnhandledRejectionMessages.delete(key)
        })
      }
    }

    window.addEventListener('error', (event) => {
      if (
        event.error &&
        typeof event.error === 'object' &&
        recentUnhandledRejections.has(event.error)
      ) {
        return
      }
      if (
        (!event.error || typeof event.error !== 'object') &&
        recentUnhandledRejectionMessages.has(
          String(event.error ?? event.message),
        )
      ) {
        return
      }
      sendError('error', event.error)
    })
    window.addEventListener('unhandledrejection', (event) => {
      rememberUnhandledRejection(event.reason)
      sendError('unhandled-rejection', event.reason)
    })
  }

  // TODO: server runtime?
  // if (typeof process !== 'undefined') {}
}

// TODO: adopt vitest utils for stringify?
function stringifyConsoleArg(value: unknown): string {
  if (typeof value === 'string') {
    return value
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
