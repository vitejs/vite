import 'vite/types/customEvent'

declare module 'vite/types/customEvent' {
  interface CustomEventMap {
    'custom:foo': { msg: string }
    'custom:remote-add': { a: number; b: number }
    'custom:remote-add-result': { result: string }
  }
}

declare global {
  let log: (...msg: unknown[]) => void
  let logger: {
    error: (msg: string | Error) => void
    debug: (...msg: unknown[]) => void
  }
}
