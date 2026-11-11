import { displayCount } from './re-export.js'

const button = document.querySelector('.orphan-no-boundary-increment')

const render = () => {
  document.querySelector('.orphan-no-boundary-display').textContent =
    displayCount(Number(button.textContent))
}

render()

const increment = () => {
  button.textContent = `${Number(button.textContent) + 1}`
  render()
}
button.addEventListener('click', increment)

if (import.meta.hot) {
  import.meta.hot.accept()
  import.meta.hot.dispose(() => button.removeEventListener('click', increment))
}
