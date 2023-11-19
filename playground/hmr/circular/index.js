import { msg } from './mod-a'

document.querySelector('.circular').textContent = msg

if (import.meta.hot) {
  import.meta.hot.accept()
}
