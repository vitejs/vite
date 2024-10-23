import './base.css'

export function createButton(className) {
  const button = document.createElement('button')
  button.className = `btn ${className}`
  document.body.appendChild(button)
  button.textContent = `button ${getComputedStyle(button).color}`
}
