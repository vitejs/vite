import { value } from './outer'

document.querySelector('.circular-boundary-many-modules').textContent = value

if (import.meta.hot) {
  import.meta.hot.accept()
}
