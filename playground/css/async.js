import './async.css'

const div = document.createElement('div')
div.className = 'async'
document.body.appendChild(div)
div.textContent = `async chunk (this should be teal) ${
  getComputedStyle(div).color
}`
