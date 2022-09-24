import 'vite'
import 'vite/client/types'

interface MyCustomEventMap {
  'custom:foo': { msg: string }
  'custom:remote-add': { a: number; b: number }
  'custom:remote-add-result': { result: string }
}

declare module 'vite' {
  interface CustomEventMap extends MyCustomEventMap {}
}

declare module 'vite/client/types' {
  interface CustomEventMap extends MyCustomEventMap {}
}
