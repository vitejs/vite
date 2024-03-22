import { foo } from './other'

// Wrap in a callback to access `foo` later
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.main-accepted').innerHTML = foo
})

if (import.meta.hot) {
  import.meta.hot.accept('./other', (newMod) => {
    if (!newMod) return

    document.querySelector('.main-accepted').innerHTML = newMod.foo
  })
}
