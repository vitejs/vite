import { value } from './child'

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    import.meta.hot.invalidate()
  })
}

console.log('(invalidation circular deps) parent is executing')
setTimeout(() => {
  document.querySelector('.invalidation-circular-deps').innerHTML = value
})
