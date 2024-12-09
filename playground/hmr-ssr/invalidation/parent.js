import { value } from './child'

if (import.meta.hot) {
  import.meta.hot.accept()
}

log('(invalidation) parent is executing')

globalThis.__HMR__['.invalidation'] = value
