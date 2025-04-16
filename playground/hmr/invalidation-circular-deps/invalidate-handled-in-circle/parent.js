import { value } from './child'

if (import.meta.hot) {
  import.meta.hot.accept(() => {})
}

console.log('(invalidation circular deps handled) parent is executing')
setTimeout(() => {
  document.querySelector('.invalidation-circular-deps-handled').innerHTML =
    value
})
