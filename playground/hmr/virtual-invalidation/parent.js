import { value } from 'virtual:invalidation-file'

if (import.meta.hot) {
  import.meta.hot.accept()
}

document.querySelector('.virtual-invalidation-parent').innerHTML = value
