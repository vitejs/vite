import 'vite/client/types'

declare module 'vite/client/types' {
  interface CustomEventMap {
    'custom:foo': { msg: string }
    'custom:remote-add': { a: number; b: number }
    'custom:remote-add-result': { result: string }
  }
}
