import { value } from './child'

if (import.meta.hot) {
  import.meta.hot.accept()
}

console.log('(invalidation) parent is executing')

document.querySelector('.invalidation-parent').innerHTML = value
