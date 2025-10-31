import type { RuntimeLogPayload } from 'types/customEvent'
import type { NormalizedModuleRunnerTransport } from './moduleRunnerTransport'

export function setupRuntimeLogHandler(
  transport: NormalizedModuleRunnerTransport,
): void {
  function sendError(error: any) {
    // TODO: serialize extra properties, recursive cause, etc.
    transport.send({
      type: 'custom',
      event: 'vite:runtime-log',
      data: {
        error: {
          name: error?.name || 'Error',
          message: error?.message || String(error),
          stack: error?.stack,
        },
      } satisfies RuntimeLogPayload,
    })
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      sendError(event.error)
    })
    window.addEventListener('unhandledrejection', (event) => {
      sendError(event.reason)
    })
  }

  // TODO: server runtime?
  // if (typeof process !== 'undefined') {}
}
