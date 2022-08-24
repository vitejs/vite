import 'vite/types/custom-event'

declare module 'vite/types/custom-event' {
  interface CustomEventMap {
    'custom:foo': { msg: string }
    'custom:remote-add': { a: number; b: number }
    'custom:remote-add-result': { result: string }
  }
}
