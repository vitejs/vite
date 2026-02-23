import type { ForwardConsolePayload } from '#types/customEvent'
import type { NormalizedModuleRunnerTransport } from './moduleRunnerTransport'

type ForwardConsoleLogLevel = Extract<
  ForwardConsolePayload,
  { type: 'log' }
>['data']['level']

interface ResolvedForwardConsoleOptions {
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
