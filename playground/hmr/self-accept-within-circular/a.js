import { b } from './b'

export const a = {
  b,
}

if (import.meta.hot) {
  import.meta.hot.accept()
}
