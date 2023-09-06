import { displayCount } from './re-export.js'

const button = document.querySelector('.intermediate-file-delete-increment')

const render = () => {
  document.querySelector('.intermediate-file-delete-display').textContent =
    displayCount(Number(button.textContent))
}

render()

button.addEventListener('click', () => {
  button.textContent = `${Number(button.textContent) + 1}`
  render()
})

if (import.meta.hot) import.meta.hot.accept()
