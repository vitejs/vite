import { value } from './dep.js'

document.querySelector('.self-accepting-boundary-value').textContent = value

if (import.meta.hot) {
  import.meta.hot.accept()
}
