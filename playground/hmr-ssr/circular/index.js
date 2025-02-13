import { msg } from './mod-a'

globalThis.__HMR__['.circular'] = msg

if (import.meta.hot) {
  import.meta.hot.accept()
}
