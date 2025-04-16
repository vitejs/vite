import { value } from './child'

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    import.meta.hot.invalidate()
  })
}

log('(invalidation circular deps) parent is executing')
setTimeout(() => {
  globalThis.__HMR__['.invalidation-circular-deps'] = value
})
