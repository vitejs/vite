import { b } from './b'

export const value = 'a:' + b

if (import.meta.hot) {
  import.meta.hot.accept()
}
