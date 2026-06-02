import { value } from './child'

if (import.meta.hot) {
  import.meta.hot.accept(() => {})
}

log('(invalidation circular deps handled) parent is executing')
setTimeout(() => {
  globalThis.__HMR__['.invalidation-circular-deps-handled'] = value
})
