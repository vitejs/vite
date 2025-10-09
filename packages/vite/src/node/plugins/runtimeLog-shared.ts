import type { NormalizedModuleRunnerTransport } from '../../shared/moduleRunnerTransport'

export type RuntimeLogPayload = {
  error: {
    name: string
    message: string
    stack?: string
  }
}

export function setupRuntimeLog(
  transport: NormalizedModuleRunnerTransport,
): void {
  function sendError(error: any) {
    // TODO: serialize extra properties, recursive cause, etc.
    transport.send({
      type: 'custom',
      event: 'vite:runtime-log',
      data: {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
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
