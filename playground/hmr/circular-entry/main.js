import { foo } from './other'

// Wrap in a callback to access `foo` later
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.main').innerHTML = foo
})
