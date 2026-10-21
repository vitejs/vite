import { displayCount } from './re-export.js'

const button = document.querySelector('.orphan-reimport-increment')

const render = () => {
  document.querySelector('.orphan-reimport-display').textContent = displayCount(
    Number(button.textContent),
  )
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
